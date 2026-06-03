import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';

// Backend returns { data } / { data: [...] }; the demo baseQuery returns the value directly.
// This unwraps both shapes.
const unwrap = (res) => (res && typeof res === 'object' && 'data' in res ? res.data : res);

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Complaint'],
  endpoints: (builder) => ({
    getComplaints: builder.query({
      query: () => '/complaints',
      transformResponse: (res) => unwrap(res) ?? [],
      providesTags: (result) =>
        result
          ? [...result.map((c) => ({ type: 'Complaint', id: c._id || c.id })), { type: 'Complaint', id: 'LIST' }]
          : [{ type: 'Complaint', id: 'LIST' }],
    }),

    createComplaint: builder.mutation({
      query: (body) => ({ url: '/complaints', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: [{ type: 'Complaint', id: 'LIST' }],
    }),

    updateComplaintStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/complaints/${id}/status`, method: 'PATCH', body: { status } }),
      transformResponse: unwrap,
      invalidatesTags: (result, error, { id }) => [{ type: 'Complaint', id }, { type: 'Complaint', id: 'LIST' }],
    }),

    deleteComplaint: builder.mutation({
      query: (id) => ({ url: `/complaints/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [{ type: 'Complaint', id }, { type: 'Complaint', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetComplaintsQuery,
  useCreateComplaintMutation,
  useUpdateComplaintStatusMutation,
  useDeleteComplaintMutation,
} = api;
