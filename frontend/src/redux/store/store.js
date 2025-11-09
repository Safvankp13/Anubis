import{configureStore} from "@reduxjs/toolkit"
import { apiSlice } from "./api/apiSlice"
import scanReducer from "./slices/scanSlice"
const store=configureStore({
    reducer:{
        scans:scanReducer,
        [apiSlice.reducerPath]:apiSlice.reducer,
    },
    middleware:(getDefaultMiddleware)=>
        getDefaultMiddleware().concat(apiSlice.middleware),
})
export default store
