export type CommunityMember = {
  id: string;
  wallet_address_id: null | number;
  project_id: number;
  first_name: string;
  last_name: string;
  title: string;
  bio: string;
  profile_image_url: string | null;
  display_order: number | null;
};
