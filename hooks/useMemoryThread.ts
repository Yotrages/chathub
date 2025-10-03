import { api } from '@/libs/axios/config';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface FetchMemoryThreadsParams {
  userId: string;
  participantId: string;
  keywords: string[];
}

interface ProcessContentParams {
  userId: string;
  content: string;
  participants: string[];
  postId: string;
}

export const useMemoryThreads = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [params, setParams] = useState<FetchMemoryThreadsParams | null>(null);

  const { data: memoryThreads, isLoading, error } = useQuery({
    queryKey: ['memory-threads', params?.userId, params?.participantId, params?.keywords],
    queryFn: async () => {
      if (!params) return [];
      
      const response = await api.post('/api/memory-threads', params);
      
      if (!response.data) throw new Error('Failed to fetch memory threads');
      return response.data;
    },
    enabled: isEnabled && !!params,
    staleTime: 5 * 60 * 1000, 
  });

  const processContentMutation = useMutation({
    mutationFn: async (data: ProcessContentParams) => {
      const response = await api.post('/api/memory-threads/process', data);
      
      if (!response.data) throw new Error('Failed to process content');
      return response.data;
    },
  });

  const fetchMemoryThreads = (fetchParams: FetchMemoryThreadsParams) => {
    setParams(fetchParams);
    setIsEnabled(true);
  };

  const clearMemoryThreads = () => {
    setIsEnabled(false);
    setParams(null);
  };

  const processContent = (data: ProcessContentParams) => {
    processContentMutation.mutate(data);
  };

  return {
    memoryThreads: memoryThreads || [],
    isLoading,
    error,
    fetchMemoryThreads,
    clearMemoryThreads,
    processContent,
  };
};
