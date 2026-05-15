export type Database = {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          chat_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          chat_id?: string;
          user_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      message_attachments: {
        Row: {
          id: string;
          user_id: string;
          chat_id: string;
          message_id: string | null;
          bucket: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          file_size: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chat_id: string;
          message_id?: string | null;
          bucket?: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          file_size: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          chat_id?: string;
          message_id?: string | null;
          bucket?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string;
          file_size?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_attachments_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_attachments_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
