import { createHash } from "crypto";
import type { SupabaseClient } from "../../db/supabase.client";
import type { Tables, TablesInsert, TablesUpdate } from "../../db/database.types";
import type {
  FlashcardEntity,
  CreateFlashcardDto,
  UpdateFlashcardDto,
  FlashcardQueryDto,
  PaginatedResponseDto,
  BatchCreateResponse,
  FlashcardSource,
} from "../../types";

type FlashcardRow = Tables<"flashcards">;
type FlashcardInsert = TablesInsert<"flashcards">;
type FlashcardUpdate = TablesUpdate<"flashcards">;

/**
 * Service class for managing flashcard operations with business logic validation
 * and database interactions through Supabase client with RLS policies
 */
export class FlashcardService {
  constructor(
    private supabase: SupabaseClient,
    private userId: string
  ) {}

  /**
   * Generate MD5 hash for flashcard content (for duplicate detection)
   */
  private generateContentHash(front: string, back: string): string {
    const content = `${front.trim().toLowerCase()}|${back.trim().toLowerCase()}`;
    return createHash("md5").update(content).digest("hex");
  }

  /**
   * Get paginated list of flashcards with optional filtering and sorting
   */
  async getFlashcards(query: FlashcardQueryDto): Promise<PaginatedResponseDto<FlashcardEntity>> {
    let supabaseQuery = this.supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", this.userId);

    // Apply search filter (full-text search on front and back)
    if (query.search) {
      // Use ilike for simple substring matching (more user-friendly than tsquery)
      // Search in both front and back fields using OR condition
      // Supabase .or() syntax: "column.operator.value,column2.operator.value2"
      const searchTerm = query.search.replace(/'/g, "''"); // Escape single quotes for SQL
      supabaseQuery = supabaseQuery.or(`front.ilike.%${searchTerm}%,back.ilike.%${searchTerm}%`);
    }

    // Apply subject filter (exact match)
    if (query.subject) {
      supabaseQuery = supabaseQuery.eq("subject", query.subject);
    }

    // Apply sorting
    const sortField = query.sort === "next_review_at" ? "next_review_at" : "created_at";
    const ascending = query.order === "asc";
    supabaseQuery = supabaseQuery.order(sortField, { ascending });

    // Apply pagination or limit
    let page = 1;
    let pageSize = 50;

    if (query.limit) {
      // Use limit parameter
      pageSize = query.limit;
      supabaseQuery = supabaseQuery.limit(query.limit);
    } else {
      // Use page/pageSize parameters
      page = query.page || 1;
      pageSize = query.pageSize || 50;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      supabaseQuery = supabaseQuery.range(from, to);
    }

    const { data, error, count } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      data: data.map(this.mapRowToEntity),
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  /**
   * Get a single flashcard by ID
   */
  async getFlashcardById(flashcardId: string): Promise<FlashcardEntity | null> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", this.userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to fetch flashcard: ${error.message}`);
    }

    return this.mapRowToEntity(data);
  }

  /**
   * Create a single flashcard
   */
  async createFlashcard(flashcardData: CreateFlashcardDto): Promise<FlashcardEntity> {
    // Check user's flashcard limit (max 2000)
    await this.checkFlashcardLimit();

    // Format date as YYYY-MM-DD for date column (not timestamp)
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    const insertData: FlashcardInsert = {
      user_id: this.userId,
      front: flashcardData.front,
      back: flashcardData.back,
      subject: flashcardData.subject || null,
      source: flashcardData.source || "manual",
      generation_id: flashcardData.generationId || null,
      // Default spaced repetition values
      next_review_at: dateString,
      ease_factor: 2.5,
      review_count: 0,
    };

    const { data, error } = await this.supabase.from("flashcards").insert(insertData).select().single();

    if (error) {
      console.error("Supabase error creating flashcard:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        insertData,
      });

      if (error.code === "23505") {
        throw new Error("Flashcard with this content already exists");
      }

      // Provide more detailed error message
      const errorMessage = error.details ? `${error.message}. Details: ${error.details}` : error.message;
      throw new Error(`Failed to create flashcard: ${errorMessage}`);
    }

    return this.mapRowToEntity(data);
  }

  /**
   * Create multiple flashcards in a batch transaction
   */
  async createFlashcardsBatch(flashcardsData: CreateFlashcardDto[]): Promise<BatchCreateResponse> {
    if (flashcardsData.length === 0) {
      throw new Error("At least one flashcard is required");
    }

    if (flashcardsData.length > 50) {
      throw new Error("Cannot create more than 50 flashcards at once");
    }

    // Check user's flashcard limit (max 2000)
    await this.checkFlashcardLimit(flashcardsData.length);

    // Format date as YYYY-MM-DD for date column (not timestamp)
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    const insertData: FlashcardInsert[] = flashcardsData.map((flashcard) => {
      return {
        user_id: this.userId,
        front: flashcard.front,
        back: flashcard.back,
        subject: flashcard.subject || null,
        source: flashcard.source || "manual",
        generation_id: flashcard.generationId || null,
        // Default spaced repetition values
        next_review_at: dateString,
        ease_factor: 2.5,
        review_count: 0,
      };
    });

    const { data, error } = await this.supabase.from("flashcards").insert(insertData).select();

    if (error) {
      throw new Error(`Failed to create flashcards batch: ${error.message}`);
    }

    return {
      created: data.length,
      flashcards: data.map(this.mapRowToEntity),
    };
  }

  /**
   * Update a flashcard (full update - PUT)
   */
  async updateFlashcard(flashcardId: string, updateData: UpdateFlashcardDto): Promise<FlashcardEntity | null> {
    const updatePayload: FlashcardUpdate = {
      ...(updateData.front && { front: updateData.front }),
      ...(updateData.back && { back: updateData.back }),
      ...(updateData.subject !== undefined && { subject: updateData.subject }),
      ...(updateData.source && { source: updateData.source }),
      ...(updateData.generationId !== undefined && { generation_id: updateData.generationId }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from("flashcards")
      .update(updatePayload)
      .eq("id", flashcardId)
      .eq("user_id", this.userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }

    return this.mapRowToEntity(data);
  }

  /**
   * Delete a flashcard
   */
  async deleteFlashcard(flashcardId: string): Promise<boolean> {
    const { error } = await this.supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", this.userId);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }

    return true;
  }

  /**
   * Check if user has reached the flashcard limit (2000 cards)
   */
  private async checkFlashcardLimit(additionalCards = 1): Promise<void> {
    const { count, error } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", this.userId);

    if (error) {
      throw new Error(`Failed to check flashcard limit: ${error.message}`);
    }

    const currentCount = count || 0;
    const maxLimit = 2000;

    if (currentCount + additionalCards > maxLimit) {
      throw new Error(`Flashcard limit exceeded. Maximum ${maxLimit} flashcards allowed per user.`);
    }
  }

  /**
   * Map database row to FlashcardEntity
   */
  private mapRowToEntity(row: FlashcardRow): FlashcardEntity {
    return {
      id: row.id,
      front: row.front,
      back: row.back,
      subject: row.subject,
      source: row.source as FlashcardSource,
      generationId: row.generation_id,
      nextReviewAt: row.next_review_at,
      lastReviewAt: row.last_review_at,
      reviewCount: row.review_count,
      easeFactor: row.ease_factor,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
