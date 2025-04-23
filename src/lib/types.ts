type PaginatedApiResponseCatalog<T> = {
  success: {
    success: true;
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    data: T[];
  };
  error: {
    success: false;
    error: string;
  };
};

export type PaginatedApiResponse<T> =
  PaginatedApiResponseCatalog<T>[keyof PaginatedApiResponseCatalog<T>];

export type AsyncDataCatalog<T> = {
  loading: {
    _status: "loading";
    data: null;
  };
  success: {
    _status: "success";
    data: T;
  };
  error: {
    _status: "error";
    data: null;
    error?: string;
  };
};

export type AsyncData<T> = AsyncDataCatalog<T>[keyof AsyncDataCatalog<T>];
