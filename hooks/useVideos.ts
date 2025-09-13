import { AppDispatch } from "@/libs/redux/store";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useApiController } from "./useFetch";
import { addTrendingVideos, addVideoPosts, setTrendingVideosWithPagination, setVideoPostsWithPagination } from "@/libs/redux/postSlice";

export const useGetVideoPosts = (initialPage: number = 1) => {
  const [page, setPage] = useState(initialPage);
  const dispatch: AppDispatch = useDispatch();
  const result = useApiController({
    method: "GET",
    url: `/videos?page=${page}&limit=15`,
    onSuccess: (data) => {
      if (page === 1) {
        dispatch(setVideoPostsWithPagination(data));
      } else {
        dispatch(addVideoPosts(data.posts || []))
      }
    },
  });

  const loadMoreVideos = () => {
    if (!result.isLoading && result.data?.pagination.hasNextPage) {
        setPage((prev) => prev + 1)
    }
  }
  return { ...result, loadMoreVideos }
};

export const useGetTrendingVideoPosts = (initialPage: number = 1) => {
  const [page, setPage] = useState(initialPage);
  const dispatch: AppDispatch = useDispatch();
  const result = useApiController({
    method: "GET",
    url: `/videos/trending?page=${page}&limit=15`,
    onSuccess: (data) => {
      if (page === 1) {
        dispatch(setTrendingVideosWithPagination(data));
      } else {
        dispatch(addTrendingVideos(data.posts || []))
      }
    },
  });

  const loadMoreTrendingVideos = () => {
    if (!result.isLoading && result.data?.pagination.hasNextPage) {
        setPage((prev) => prev + 1)
    }
  }
  return { ...result, loadMoreTrendingVideos }
};

export const useGetSingleVideoPost = (postId: string) => {
  return useApiController({
    method: "GET",
    url: `/videos/${postId}`,
    queryOptions: {
      enabled: !!postId,
      staleTime: 5 * 60 * 1000,
    },
  });
};



