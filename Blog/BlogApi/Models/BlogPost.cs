using System.ComponentModel.DataAnnotations;

namespace BlogApi.Models
{
    public class BlogPost
    {
        public int Id { get; set; }

        [Required]
        [MinLength(5)]
        public string author { get; set; } = string.Empty;
 
        [Required]
        [MinLength(5)]
        public string position { get; set; } = string.Empty;

        [Required]
        [MinLength(5)]
        public string bio { get; set; } = string.Empty;

        [Required]
        public DateTime date { get; set; } = DateTime.UtcNow;

        [MinLength(10)]
        public string img_url { get; set; } = string.Empty;

        [Required]
        [MinLength(10)]
        public string header{ get; set; } = string.Empty;

        [Required]
        [MinLength(50)]
        public string content{ get; set; } = string.Empty;
    }
}