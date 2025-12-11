using BlogApi.Data;
using BlogApi.Models;
using Microsoft.EntityFrameworkCore;
using MySqlX.XDevAPI.Common;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<BlogDbContext>(opt => opt.UseSqlite("Data Source=Blog.db"));

var app = builder.Build();
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
        db.BlogPosts.Add(blogPost);
        await db.SaveChangesAsync();

        return Results.Created($"/Posts/{blogPost.Id}", blogPost);
    });

app.MapPut("/Posts/{id}", async (int id, BlogPost inputBlogPost, BlogDbContext db) =>
{
    var blogPost = await db.BlogPosts.FindAsync(id);

    if (blogPost is null) return Results.NotFound();

   

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
    