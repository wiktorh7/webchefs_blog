using System.ComponentModel.DataAnnotations;

namespace BlogApi.Models
{
    public class BlogPost
    {
        public int Id { get; set; }

        [Required]
        public string author { get; set; } = string.Empty;
 
        [Required]
        public string position { get; set; } = string.Empty;

        [Required]
        public string bio { get; set; } = string.Empty;

        [Required]
        public DateTime date { get; set; } = DateTime.UtcNow;

        public string img_url { get; set; } = string.Empty;

        [Required]
        public string header{ get; set; } = string.Empty;

        [Required]
        public string content{ get; set; } = string.Empty;
    }
}