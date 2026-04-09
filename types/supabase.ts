export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4';
  };
  public: {
    Tables: {
      hotel_tags: {
        Row: {
          hotel_id: string;
          tag_id: string;
        };
        Insert: {
          hotel_id: string;
          tag_id: string;
        };
        Update: {
          hotel_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'hotel_tags_hotel_id_fkey';
            columns: ['hotel_id'];
            isOneToOne: false;
            referencedRelation: 'hotels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'hotel_tags_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          },
        ];
      };
      hotels: {
        Row: {
          created_at: string | null;
          google_photo_url: string;
          google_place_id: string;
          google_rating: number;
          google_review_count: number;
          has_private_bath: boolean;
          has_public_bath: boolean;
          has_sauna: boolean;
          hotel_information_url: string | null;
          id: string;
          image_url: string;
          latitude: number;
          longitude: number;
          min_charge: number;
          name: string;
          prefecture: string;
          rakuten_hotel_id: number;
          separate_bath_rooms: string[];
          shower_only_rooms: string[];
        };
        Insert: {
          created_at?: string | null;
          google_photo_url?: string;
          google_place_id?: string;
          google_rating?: number;
          google_review_count?: number;
          has_private_bath?: boolean;
          has_public_bath?: boolean;
          has_sauna?: boolean;
          hotel_information_url?: string | null;
          id?: string;
          image_url?: string;
          latitude?: number;
          longitude?: number;
          min_charge?: number;
          name?: string;
          prefecture?: string;
          rakuten_hotel_id: number;
          separate_bath_rooms?: string[];
          shower_only_rooms?: string[];
        };
        Update: {
          created_at?: string | null;
          google_photo_url?: string;
          google_place_id?: string;
          google_rating?: number;
          google_review_count?: number;
          has_private_bath?: boolean;
          has_public_bath?: boolean;
          has_sauna?: boolean;
          hotel_information_url?: string | null;
          id?: string;
          image_url?: string;
          latitude?: number;
          longitude?: number;
          min_charge?: number;
          name?: string;
          prefecture?: string;
          rakuten_hotel_id?: number;
          separate_bath_rooms?: string[];
          shower_only_rooms?: string[];
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_hotels_by_tags: {
        Args: { tag_slugs: string[] };
        Returns: {
          hotel_google_photo_url: string;
          hotel_google_rating: number;
          hotel_google_review_count: number;
          hotel_has_private_bath: boolean;
          hotel_has_public_bath: boolean;
          hotel_has_sauna: boolean;
          hotel_image_url: string;
          hotel_latitude: number;
          hotel_longitude: number;
          hotel_min_charge: number;
          hotel_name: string;
          hotel_prefecture: string;
          hotel_tag_slugs: string[];
          rakuten_hotel_id: number;
          separate_bath_rooms: string[];
          shower_only_rooms: string[];
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
