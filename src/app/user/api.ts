import { fetchClinet } from "@/utils/fetcher";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

interface UserResponse {
  data: User;
  message: string;
}

export const userApi = {
  getUser: async () => {
    const response = await fetchClinet.get<UserResponse>("/user");
    return response.data;
  },
};
