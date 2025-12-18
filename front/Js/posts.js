const API_BASE_URL = 'http://localhost:5293';

async function getAllPosts() {
    const response = await axios.get(`${API_BASE_URL}/Posts`);
    return response.data;
}

async function getPost(postId) {
    const response = await axios.get(`${API_BASE_URL}/Posts/${postId}`);
    return response.data;
}

async function createNewPost(postData) {
    const response = await axios.post(`${API_BASE_URL}/Posts`, postData, {
        headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
}

async function removePost(postId) {
    const response = await axios.delete(`${API_BASE_URL}/Posts/${postId}`);
    return response.data;
}

async function submitPostForm() {
    const author = document.getElementById('author')?.value.trim() || '';
    const position = document.getElementById('title')?.value.trim() || '';
    const bio = document.getElementById('bio')?.value.trim() || '';
    const header = document.getElementById('title-input')?.value.trim() || '';
    const content = document.getElementById('content')?.value.trim() || '';
    const imageFile = document.getElementById('main-image')?.files?.[0];

    if (author.length < 5) { showFormStatus('Autor musi mieć co najmniej 5 znaków.', true); return; }
    if (position.length < 5) { showFormStatus('Stanowisko musi mieć co najmniej 5 znaków.', true); return; }
    if (header.length < 10) { showFormStatus('Nagłówek musi mieć co najmniej 10 znaków.', true); return; }
    if (content.length < 50) { showFormStatus('Tekst posta musi mieć co najmniej 50 znaków.', true); return; }

    showFormStatus('Wysyłam...', false);

    try {
        let imgData = '';
        if (imageFile) {
            imgData = await readFileAsDataURL(imageFile);
        }

        const payload = { author, position, bio, header, content, img_url: imgData };

        const created = await createNewPost(payload);
        showFormStatus('Post został utworzony.', false);
        document.getElementById('post-form')?.reset();
        if (typeof fetchBlogPosts === 'function') fetchBlogPosts(currentLimit);
    } catch (err) {
        console.error('Error creating post:', err);
        if (err.response && err.response.status === 400) {
            const data = err.response.data;
            const msg = data?.errors ? Object.values(data.errors).flat().join(' ') : (data?.title || JSON.stringify(data));
            showFormStatus(msg || 'Błąd podczas tworzenia posta.', true);
        } else {
            showFormStatus('Błąd podczas tworzenia posta.', true);
        }
    }
}

function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max).trim() + '…' : text;
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
}

function formatDate(d) {
    try {
        const date = new Date(d);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return d;
    }
}

function renderPosts(posts) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!posts.length) {
        grid.innerHTML = '<p>Brak dostępnych postów.</p>';
        return;
    }

    let postsHTML = '';

    posts.forEach(post => {
        const id = post.id ?? post.Id;
        const title = post.header ?? '';
        const content = post.content ?? '';
        const description = truncate(stripHtml(content), 180);
        const author = post.author ?? '';
        const date = post.date ? formatDate(post.date) : '';
        const img = post.img_url ?? post.imgUrl ?? 'img/placeholder.png';

        postsHTML += `
            <div class="blog-article" style="position: relative;">
                <a class="link" href="article.html?id=${encodeURIComponent(id)}">
                    <img class="blog-image" src="${img || 'img/placeholder.png'}" alt="${title}">
                    <div class="blog-content">
                        <h3 class="blog-title">${title}</h3>
                        <p class="blog-description">${description}</p>
                        <div class="blog-meta">
                            <span class="blog-author">${author}</span>
                            <span class="blog-date">${date}</span>
                        </div>
                    </div>
                </a>
                <button class="delete-btn" data-id="${id}" style="position: absolute; top: 10px; right: 10px; background: rgba(255, 0, 0, 0.8); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: none; z-index: 10;">🗑️</button>
            </div>
        `;
    });

    grid.innerHTML = postsHTML;
    const articles = grid.querySelectorAll('.blog-article');
    articles.forEach(article => {
        const deleteBtn = article.querySelector('.delete-btn');
        const id = deleteBtn.dataset.id;
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this post?')) {
                removePost(id).then(() => {
                    if (typeof fetchBlogPosts === 'function') fetchBlogPosts(currentLimit);
                }).catch(err => {
                    console.error('Error deleting post:', err);
                    alert('Failed to delete post');
                });
            }
        });
        article.addEventListener('mouseenter', () => {
            deleteBtn.style.display = 'block';
        });
        article.addEventListener('mouseleave', () => {
            deleteBtn.style.display = 'none';
        });
    });
}

function renderArticle(post) {
    if (!post) return;

    const imgEl = document.querySelector('.blog-hero-img img');
    if (imgEl) imgEl.src = post.img_url || post.imgUrl || 'img/placeholder.png';

    const titleEl = document.querySelector('.blog-hero-title h1');
    if (titleEl) titleEl.textContent = post.header || '';

    const authorEl = document.querySelector('.blog-hero-title .author');
    if (authorEl) authorEl.textContent = post.author || '';

    const dateEl = document.querySelector('.blog-hero-title .date');
    if (dateEl) dateEl.textContent = post.date ? formatDate(post.date) : '';

    const contentSection = document.querySelector('.blog-content');
    if (contentSection) contentSection.innerHTML = post.content || '';

    const authorName = document.querySelector('.author-name');
    if (authorName) authorName.textContent = post.author || '';

    const positionEl = document.querySelector('.position');
    if (positionEl) positionEl.textContent = post.position || '';

    const bioEl = document.querySelector('.bio');
    if (bioEl) bioEl.textContent = post.bio || '';
}

function renderMorePosts(posts) {
    const grid = document.getElementById('more-posts-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!posts || !posts.length) {
        grid.innerHTML = '<p>Brak podobnych postów.</p>';
        return;
    }

    let postsHTML = '';

    posts.forEach(post => {
        const id = post.id ?? post.Id;
        const title = post.header ?? '';
        const description = truncate(stripHtml(post.content ?? ''), 120);
        const author = post.author ?? '';
        const date = post.date ? formatDate(post.date) : '';
        const img = post.img_url ?? post.imgUrl ?? 'img/placeholder.png';

        postsHTML += `
            <a class="post-card" href="article.html?id=${encodeURIComponent(id)}">
                <img src="${img || 'img/placeholder.png'}" alt="${title}">
                <h3>${title}</h3>
                <p>${description}</p>
                <div class="blog-meta">
                    <span class="author">${author}</span>
                    <span class="dot"></span>
                    <span class="date">${date}</span>
                </div>
            </a>
        `;
    });

    grid.innerHTML = postsHTML;
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

let currentLimit = 6;

async function fetchBlogPosts(limit = 6) {
    try {
        const posts = await getAllPosts();
        const sorted = (posts || []).slice().sort((a, b) => Number(b.id ?? b.Id ?? 0) - Number(a.id ?? a.Id ?? 0));
        const displayedPosts = limit ? sorted.slice(0, limit) : sorted;
        renderPosts(displayedPosts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        const grid = document.getElementById('blog-grid');
        if (grid) grid.innerHTML = '<p class="error">Nie udało się pobrać postów.</p>';
    }
}

async function fetchPostById(id) {
    try {
        const post = await getPost(id);
        renderArticle(post);
    } catch (err) {
        console.error('Error fetching post:', err);
        const main = document.querySelector('.blog-main');
        if (main) main.innerHTML = '<p class="error">Nie udało się pobrać artykułu.</p>';
    }
}

async function fetchMoreLikeThis(currentId, max = 3) {
    try {
        const posts = await getAllPosts();
        let filtered = posts.filter(p => (p.id ?? p.Id)?.toString() !== currentId?.toString());
        filtered = filtered.slice().sort((a, b) => Number(b.id ?? b.Id ?? 0) - Number(a.id ?? a.Id ?? 0));
        const selected = filtered.slice(0, max);
        renderMorePosts(selected);
    } catch (err) {
        console.error('Error fetching related posts:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let isShowingAll = false;

    if (document.getElementById('blog-grid')) fetchBlogPosts(currentLimit);

    if (document.querySelector('.blog-main')) {
        const id = getQueryParam('id');
        if (id) {
            fetchPostById(id);
            fetchMoreLikeThis(id);
        }
    }

    const form = document.getElementById('post-form');
    if (form) form.addEventListener('submit', submitPostForm);

    const fileInput = document.getElementById('main-image');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const span = document.querySelector('.file-upload-label span');
                if (span) {
                    span.textContent = file.name;
                    span.style.display = 'block';
                }
                const img = document.querySelector('.file-upload-label img');
                if (img) img.style.display = 'none';
            }
        });
    }

    const viewAllBtn = document.querySelector('.posts-button');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isShowingAll) {
                currentLimit = 6;
                fetchBlogPosts(6);
                viewAllBtn.textContent = 'View All Posts';
                isShowingAll = false;
            } else {
                currentLimit = null;
                fetchBlogPosts(null);
                viewAllBtn.textContent = 'Show Less Posts';
                isShowingAll = true;
            }
        });
    }
});