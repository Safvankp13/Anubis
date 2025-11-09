import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  scans: [],
  currentScan: null,
  status: "idle",
  error: null,
};

const scanSlice=createSlice({
    name:"scans",
    initialState,
    reducers:{

      saveScanSummary: (state, action) => {
  const { id, summary } = action.payload;
  const index = state.scans.findIndex((s) => s.id === id);

  if (index !== -1) {
    state.scans[index].summary = summary; 
  } else {
    state.scans.push({ id, summary }); 
  }
},
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    }
})

export const{saveScanSummary,setCurrentScan,setStatus,setError}=scanSlice.actions;
export default scanSlice.reducer;