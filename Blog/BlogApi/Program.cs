using BlogApi.Data;
using BlogApi.Models;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using MySqlX.XDevAPI.Common;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<BlogDbContext>(opt => opt.UseSqlite("Data Source=Blog.db"));

var app = builder.Build();

static IResult? ValidateModel<T>(T model)
{
    var validationResults = new List<ValidationResult>();
    var context = new ValidationContext(model);
    if (!Validator.TryValidateObject(model, context, validationResults, validateAllProperties: true))
    {
        var errors = validationResults
            .SelectMany(r => r.MemberNames.DefaultIfEmpty(string.Empty).Select(m => (Member: m, r.ErrorMessage)))
            .GroupBy(p => p.Member)
            .ToDictionary(g => g.Key, g => g.Select(p => p.ErrorMessage ?? string.Empty).ToArray());

        return Results.ValidationProblem(errors);
    }

    return null;
}
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BlogDbContext>();
    db.Database.EnsureCreated();
}

app.MapGet("/Posts", async  ( BlogDbContext db) =>
    await db.BlogPosts.ToListAsync());

app.MapGet("/Posts/{id}", async (int id, BlogDbContext db) =>
    await db.BlogPosts.FindAsync(id)
    is BlogPost blogPost
    ? Results.Ok(blogPost)
    : Results.NotFound());

app.MapPost("/Posts", async (BlogPost blogPost, BlogDbContext db) =>
    {
        var validation = ValidateModel(blogPost);
        if (validation is not null) return validation;

        db.BlogPosts.Add(blogPost);
        await db.SaveChangesAsync();

        return Results.Created($"/Posts/{blogPost.Id}", blogPost);
    });

app.MapPut("/Posts/{id}", async (int id, BlogPost inputBlogPost, BlogDbContext db) =>
{
    var blogPost = await db.BlogPosts.FindAsync(id);

    if (blogPost is null) return Results.NotFound();
    
    if (inputBlogPost.Id != 0 && inputBlogPost.Id != id)
        return Results.BadRequest(new { error = "Id in body must match route id or be omitted." });

    var validation = ValidateModel(inputBlogPost);
    if (validation is not null) return validation;

    var originalId = blogPost.Id;
    db.Entry(blogPost).CurrentValues.SetValues(inputBlogPost);
    blogPost.Id = originalId;
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.MapDelete("/Posts/{id}", async (int id, BlogDbContext db) =>
{
    if (await db.BlogPosts.FindAsync(id) is BlogPost blogPost)
    {
        db.BlogPosts.Remove(blogPost);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    return Results.NotFound();
});

app.Run();
