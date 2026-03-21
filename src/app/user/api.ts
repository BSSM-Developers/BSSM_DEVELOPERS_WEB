import { fetchClient } from "@/utils/fetcher";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "USER" | "ADMIN" | "ROLE_USER" | "ROLE_ADMIN";
}

interface UserResponse {
  data: User;
  message: string;
}

export const userApi = {
  getUser: async () => {
    const response = await fetchClient.get<UserResponse>("/user");
    return response.data;
  },
};
