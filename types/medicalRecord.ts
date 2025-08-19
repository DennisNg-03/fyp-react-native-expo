export interface MedicalRecord {
  id: string;
  user_id: string;
  title: string;
  date: string;
  file_paths: string[];
	signed_urls: string[];
  ocr_text?: string;
  updated_at?: string;
}
