using System.ComponentModel.DataAnnotations;

namespace BlogApi.Models
{
    public class BlogPost
    {
        public int Id { get; set; }

        [Required]
        public string author { get; set; }

        [Required]
        public string position { get; set; }

        [Required]
        public string bio { get; set; }

        [Required]
        public DateTime date { get; set; } = DateTime.UtcNow;

        public string img_url { get; set; }

        [Required]
        public string header{ get; set; }

        [Required]
        public string content{ get; set; }
    }
}