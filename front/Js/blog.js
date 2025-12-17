async function fetchBlogPosts() {
    try {
        const response = await fetch('http://localhost:5293/Posts');
        if (!response.ok) throw new Error(response.statusText || 'Network error');
        const posts = await response.json();
        const sorted = (posts || []).slice().sort((a, b) => Number(b.id ?? b.Id ?? 0) - Number(a.id ?? a.Id ?? 0));
        console.log('Fetched posts (sorted):', sorted);
        renderPosts(sorted);
    } catch (error) {
        console.error('Error fetching posts:', error);
        const grid = document.getElementById('blog-grid');
        if (grid) grid.innerHTML = '<p class="error">Nie udało się pobrać postów.</p>';
    }
}

async function deletePost(id) {
    try {
        const res = await fetch(`http://localhost:5293/Posts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchBlogPosts(); // refresh posts
        } else {
            alert('Failed to delete post');
        }
    } catch (err) {
        console.error('Error deleting post:', err);
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

    posts.forEach(post => {
        const id = post.id ?? post.Id;
        const title = post.header ?? post.header ?? '';
        const content = post.content ?? '';
        const description = truncate(stripHtml(content), 180);
        const author = post.author ?? '';
        const date = post.date ? formatDate(post.date) : '';
        const img = post.img_url ?? post.imgUrl ?? 'img/placeholder.png';

        const articleWrap = document.createElement('div');
        articleWrap.className = 'blog-article';

        const link = document.createElement('a');
        link.className = 'link';
        link.href = `article.html?id=${encodeURIComponent(id)}`;

        const imgEl = document.createElement('img');
        imgEl.className = 'blog-image';
        imgEl.src = img || 'img/placeholder.png';
        imgEl.alt = title;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'blog-content';

        const h3 = document.createElement('h3');
        h3.className = 'blog-title';
        h3.textContent = title;

        const p = document.createElement('p');
        p.className = 'blog-description';
        p.textContent = description;

        const meta = document.createElement('div');
        meta.className = 'blog-meta';

        const authorSpan = document.createElement('span');
        authorSpan.className = 'blog-author';
        authorSpan.textContent = author;

        const dateSpan = document.createElement('span');
        dateSpan.className = 'blog-date';
        dateSpan.textContent = date;

        meta.appendChild(authorSpan);
        meta.appendChild(dateSpan);

        contentDiv.appendChild(h3);
        contentDiv.appendChild(p);
        contentDiv.appendChild(meta);

        link.appendChild(imgEl);
        link.appendChild(contentDiv);

        articleWrap.appendChild(link);

        // Add delete button
        articleWrap.style.position = 'relative';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '10px';
        deleteBtn.style.right = '10px';
        deleteBtn.style.background = 'rgba(255, 0, 0, 0.8)';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.width = '30px';
        deleteBtn.style.height = '30px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.display = 'none';
        deleteBtn.style.zIndex = '10';
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this post?')) {
                deletePost(id);
            }
        });
        articleWrap.appendChild(deleteBtn);

        // Show delete button on hover
        articleWrap.addEventListener('mouseenter', () => {
            deleteBtn.style.display = 'block';
        });
        articleWrap.addEventListener('mouseleave', () => {
            deleteBtn.style.display = 'none';
        });

        grid.appendChild(articleWrap);
    });
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

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

async function fetchPostById(id) {
    try {
        const res = await fetch(`http://localhost:5293/Posts/${id}`);
        if (!res.ok) throw new Error(res.statusText || 'Network error');
        const post = await res.json();
        renderArticle(post);
    } catch (err) {
        console.error('Error fetching post:', err);
        const main = document.querySelector('.blog-main');
        if (main) main.innerHTML = '<p class="error">Nie udało się pobrać artykułu.</p>';
    }
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

async function fetchMoreLikeThis(currentId, max = 3) {
    try {
        const res = await fetch('http://localhost:5293/Posts');
        if (!res.ok) throw new Error(res.statusText || 'Network error');
        let posts = await res.json();
        posts = posts.filter(p => (p.id ?? p.Id)?.toString() !== currentId?.toString());
        posts = posts.slice().sort((a, b) => Number(b.id ?? b.Id ?? 0) - Number(a.id ?? a.Id ?? 0));
        const selected = posts.slice(0, max);
        renderMorePosts(selected);
    } catch (err) {
        console.error('Error fetching related posts:', err);
    }
}

function renderMorePosts(posts) {
    const grid = document.getElementById('more-posts-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!posts || !posts.length) {
        grid.innerHTML = '<p>Brak podobnych postów.</p>';
        return;
    }

    posts.forEach(post => {
        const id = post.id ?? post.Id;
        const title = post.header ?? '';
        const description = truncate(stripHtml(post.content ?? ''), 120);
        const author = post.author ?? '';
        const date = post.date ? formatDate(post.date) : '';
        const img = post.img_url ?? post.imgUrl ?? 'img/placeholder.png';

        const a = document.createElement('a');
        a.className = 'post-card';
        a.href = `article.html?id=${encodeURIComponent(id)}`;

        const imgEl = document.createElement('img');
        imgEl.src = img || 'img/placeholder.png';
        imgEl.alt = title;

        const h3 = document.createElement('h3');
        h3.textContent = title;

        const p = document.createElement('p');
        p.textContent = description;

        const meta = document.createElement('div');
        meta.className = 'blog-meta';

        const authorSpan = document.createElement('span');
        authorSpan.className = 'author';
        authorSpan.textContent = author;

        const dot = document.createElement('span');
        dot.className = 'dot';

        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        dateSpan.textContent = date;

        meta.appendChild(authorSpan);
        meta.appendChild(dot);
        meta.appendChild(dateSpan);

        a.appendChild(imgEl);
        a.appendChild(h3);
        a.appendChild(p);
        a.appendChild(meta);

        grid.appendChild(a);
    });
}

function showFormStatus(message, isError = false) {
    const status = document.getElementById('post-form-status');
    if (!status) return;
    status.textContent = message;
    status.className = isError ? 'form-status error' : 'form-status success';
}

async function handlePostFormSubmit(e) {
    e.preventDefault();
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

        const res = await fetch('http://localhost:5293/Posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.status === 201 || res.ok) {
            const created = await res.json();
            showFormStatus('Post został utworzony.', false);
            document.getElementById('post-form')?.reset();
            fetchBlogPosts();
        } else if (res.status === 400) {
            const data = await res.json();
            const msg = data?.errors ? Object.values(data.errors).flat().join(' ') : (data?.title || JSON.stringify(data));
            showFormStatus(msg || 'Błąd podczas tworzenia posta.', true);
        } else {
            throw new Error(res.statusText || 'Network error');
        }
    } catch (err) {
        console.error('Error creating post:', err);
        showFormStatus('Błąd podczas tworzenia posta.', true);
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onerror = () => { fr.abort(); reject(new Error('Problem reading file')); };
        fr.onload = () => resolve(fr.result);
        fr.readAsDataURL(file);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('blog-grid')) fetchBlogPosts();

    if (document.querySelector('.blog-main')) {
        const id = getQueryParam('id');
        if (id) {
            fetchPostById(id);
            fetchMoreLikeThis(id);
        }
    }

    const form = document.getElementById('post-form');
    if (form) form.addEventListener('submit', handlePostFormSubmit);

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
});