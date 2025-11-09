
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const Base_URL="https://an-backend-842c.onrender.com/api"

export const apiSlice=createApi(
    {
        reducerPath:'api',
        baseQuery:fetchBaseQuery({baseUrl:Base_URL}),
        endpoints:(builder)=>({
            startScan:builder.mutation({query:(body)=>({url:"/scan",method:"POST",body})}),
            getAllScan:builder.query({query:()=>"/allScans"}),
            saveScan:builder.mutation({query:(body)=>({url:"/save",method:"POST",body})}), 
            getSavedReports: builder.query({query: () => `/saved-reports`, providesTags: ["SavedReports"]}),
            saveReport: builder.mutation({query: (body) => ({url: `/saved-reports`,method:"POST",body}),
                                invalidatesTags:["SavedReports"]}),
            getPdf:builder.query({query:(scanId)=>({url:`scan/${scanId}/pdf`,method:'GET',responseHandler:(response)    =>response.blob()})}),
            deleteSavedReport: builder.mutation({query: (id) => ({ url: `/saved-reports/${id}`, method:          "DELETE" }),  invalidatesTags: ["SavedReports"],
    }),


            
        })
    }
)
export const { useDeleteSavedReportMutation,useGetPdfQuery, useSaveReportMutation,useGetSavedReportsQuery, useSaveScanMutation, useStartScanMutation,useGetAllScanQuery}=apiSlice