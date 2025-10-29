// Utility functions for favourites management

export const getFavourites = () => {
  try {
    const favourites = localStorage.getItem('favouriteProducts');
    return favourites ? JSON.parse(favourites) : {};
  } catch (error) {
    console.error('Error loading favourites:', error);
    return {};
  }
};

export const addToFavourites = (product) => {
  try {
    const favourites = getFavourites();
    // Store the ENTIRE product object for comparison features
    favourites[product.code] = product;
    localStorage.setItem('favouriteProducts', JSON.stringify(favourites));
    return true;
  } catch (error) {
    console.error('Error adding to favourites:', error);
    return false;
  }
};

export const removeFromFavourites = (code) => {
  try {
    const favourites = getFavourites();
    delete favourites[code];
    localStorage.setItem('favouriteProducts', JSON.stringify(favourites));
    return true;
  } catch (error) {
    console.error('Error removing from favourites:', error);
    return false;
  }
};

export const isFavourite = (code) => {
  const favourites = getFavourites();
  return !!favourites[code];
};
