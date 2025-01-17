import { configureStore, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_KEY, TMDB_BASE_URL } from "../utils/constants";
import axios from "axios";

const initialState = {
    movies: [],
    genresLoaded: false,
    genres: [],
};

export const getGenres = createAsyncThunk("netflix/genres", async() =>{
    const {data: {genres}} = await axios.get(`${TMDB_BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    //console.log(data);
    //console.log(genres);
    return genres;
});

const createArrayFromRawData = (array, moviesArray, genres) => {
    array.forEach((movie) => {
        const movieGenres = [];
        movie.genre_ids.forEach((genre) =>{
            const name = genres.find(({id}) => id === genre);
            //console.log(name);
            if(name)  movieGenres.push(name.name);
        });
        //console.log(movieGenres);
        if(movie.backdrop_path){
            moviesArray.push({
                id: movie.id,
                name: movie?.original_name ? movie.original_name : movie.original_title,
                image: movie.backdrop_path,
                genres: movieGenres.slice(0,3),
            });
        }
    });
}

const getRawData = async(api, genres, paging) => {
    const moviesArray = [];
    for(let i=1; moviesArray.length < 60 && i < 10; i++){
        const {data : {results}} = await axios.get(`${api}${paging ? `&page=${i}` : ""}`);
        //console.log(data);
        //console.log(results);    // each api call will have 20 movies 
                                //hence as soon as 20*3 = 60 movies stored in moviesArray loop terminates
                                //i.e. loop runs 3 times but limit is taken 10 for preventing infinite looping
        createArrayFromRawData(results, moviesArray, genres);
    }
    return moviesArray;
};

export const fetchMovies = createAsyncThunk("netflix/trending", async({type}, thunkApi) => {
    const {netflix: {genres},} = thunkApi.getState();
    //console.log(thunkApi.getState());
    return getRawData(`${TMDB_BASE_URL}/trending/${type}/week?api_key=${API_KEY}`,genres,true);
});

export const fetchDataByGenre = createAsyncThunk("netflix/moviesByGenres", async({genre, type}, thunkApi) => {
    const {netflix: {genres},} = thunkApi.getState();
    return getRawData(`${TMDB_BASE_URL}/discover/${type}?api_key=${API_KEY}&with_genres=${genre}`,
        genres);
});

export const getUserLikedMovies = createAsyncThunk("netflix/getLiked", async (email)=> {
    const {data: {movies}} = await axios.get(`https://netflix-clone-backend-utod.onrender.com/api/user/liked/${email}`);
    console.log(movies);
    return movies;
});

export const removeFromLikedMovies = createAsyncThunk("netflix/deleteLiked", async ({email, movieId})=> {
    const {data: {movies}} = await axios.put(`https://netflix-clone-backend-utod.onrender.com/api/user/delete`, {email, movieId});
    console.log(movies);
    return movies;
});

const NetflixSlice = createSlice({
    name: "Netflix",
    initialState,
    extraReducers: (builder)=>{
        builder.addCase(getGenres.fulfilled, (state, action) =>{
            state.genres = action.payload;
            state.genresLoaded = true;
            //console.log(action);
        });

        builder.addCase(fetchMovies.fulfilled, (state, action) =>{
            state.movies = action.payload;
            //console.log(action);
        });

        builder.addCase(fetchDataByGenre.fulfilled, (state, action) =>{
            state.movies = action.payload;
            //console.log(action);
        });

        builder.addCase(getUserLikedMovies.fulfilled, (state, action) =>{
            state.movies = action.payload;
            //console.log(action);
        });

        builder.addCase(removeFromLikedMovies.fulfilled, (state, action) =>{
            state.movies = action.payload;
            //console.log(action);
        });
    },
});

export const store = configureStore({
    reducer:{
        netflix: NetflixSlice.reducer,
    },
});
