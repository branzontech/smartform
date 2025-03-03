
export interface FormResponse {
  timestamp: string;
  data: {
    [key: string]: string | string[] | Record<string, any>;
  };
}
