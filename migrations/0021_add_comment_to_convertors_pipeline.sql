-- Migration: Add comment column to ConvertorsInPipeline
ALTER TABLE ConvertorsInPipeline ADD COLUMN comment TEXT;
