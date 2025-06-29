import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

const form = document.querySelector('#search-form');
const gallery = document.querySelector('.gallery');
const loader = document.querySelector('#loader');
const loadMoreBtn = document.querySelector('#load-more');
const buttonContainer = document.querySelector('.button-container');

const API_KEY = '23458422-3da75be814240b3b99c5452e1';
const BASE_URL = 'https://pixabay.com/api/';
const PER_PAGE = 40;

let currentPage = 1;
let currentQuery = '';
let totalImages = 0;

const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

function showLoader() {
  loader.classList.remove('loader-hidden');
}

function hideLoader() {
  loader.classList.add('loader-hidden');
}

function showLoadMore() {
  buttonContainer.classList.remove('hidden');
}

function hideLoadMore() {
  buttonContainer.classList.add('hidden');
}

function showToast(message, type = 'info') {
  const options = {
    titleColor: '#fff',
    iconUrl: './icon.svg',
    iconColor: '#fff',
    messageColor: '#fff',
    backgroundColor: '#ef4040',
    progressBarColor: '#b51b1b',
    message,
    position: 'topRight',
    close: true,
    timeout: 5000,
    onOpening: (instance, toast) => {
      const closeBtn = toast.querySelector('.iziToast-close');
      if (closeBtn) {
        closeBtn.innerHTML = '';
        const customIcon = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        );
        customIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        customIcon.setAttribute('width', '20');
        customIcon.setAttribute('height', '20');
        customIcon.setAttribute('viewBox', '0 0 24 24');
        customIcon.setAttribute('fill', '#fafafb');
        customIcon.innerHTML = `
          <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/>
        `;
        customIcon.style.cursor = 'pointer';
        closeBtn.appendChild(customIcon);
      }
    },
  };

  if (type === 'error') iziToast.error({ ...options, title: 'Error' });
  else if (type === 'warning')
    iziToast.warning({ ...options, title: 'Warning' });
  else iziToast.info({ ...options, title: 'Info' });
}

async function fetchImages(query, page) {
  const { data } = await axios.get(BASE_URL, {
    params: {
      key: API_KEY,
      q: query,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: true,
      per_page: PER_PAGE,
      page,
    },
  });
  return data;
}

function renderImages(images) {
  const markup = images
    .map(
      img => `
    <a href="${img.largeImageURL}" class="photo-card">
      <img src="${img.webformatURL}" alt="${img.tags}" loading="lazy" />
      <div class="info">
        <p><b>Likes:</b> ${img.likes}</p>
        <p><b>Views:</b> ${img.views}</p>
        <p><b>Comments:</b> ${img.comments}</p>
        <p><b>Downloads:</b> ${img.downloads}</p>
      </div>
    </a>
  `
    )
    .join('');
  gallery.insertAdjacentHTML('beforeend', markup);
  lightbox.refresh();
}

function smoothScroll() {
  const { height: cardHeight } = document
    .querySelector('.gallery a')
    .getBoundingClientRect();
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const query = e.target.searchQuery.value.trim();
  if (!query) return;

  currentQuery = query;
  currentPage = 1;
  gallery.innerHTML = '';
  hideLoadMore();
  showLoader();

  try {
    const data = await fetchImages(currentQuery, currentPage);
    totalImages = data.totalHits;

    if (data.hits.length === 0) {
      showToast(
        'No images found for your query. Try something else!',
        'warning'
      );
      return;
    }

    renderImages(data.hits);
    if (totalImages > PER_PAGE) {
      showLoadMore();
    } else {
      hideLoadMore();
    }
  } catch (err) {
    showToast('Something went wrong while fetching data.', 'error');
  } finally {
    hideLoader();
  }
});

loadMoreBtn.addEventListener('click', async () => {
  currentPage++;
  showLoader();

  try {
    const data = await fetchImages(currentQuery, currentPage);
    renderImages(data.hits);
    smoothScroll();

    const maxPages = Math.ceil(totalImages / PER_PAGE);
    if (currentPage >= maxPages) {
      hideLoadMore();
      showToast("We're sorry, but you've reached the end of search results.");
    }
  } catch (err) {
    showToast('Could not load more images.', 'error');
  } finally {
    hideLoader();
  }
});
