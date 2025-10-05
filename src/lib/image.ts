import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";

// Image processing configuration
export const IMAGE_CONFIG = {
  // Maximum dimensions for different image types
  MERCHANT_PROFILE: {
    width: 400,
    height: 400,
    quality: 85,
  },
  MENU_ITEM: {
    width: 600,
    height: 400,
    quality: 85,
  },
  // Thumbnail sizes
  THUMBNAIL: {
    width: 150,
    height: 150,
    quality: 80,
  },
} as const;

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

export interface ProcessedImageResult {
  success: boolean;
  outputPath?: string;
  fileName?: string;
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  error?: string;
}

/**
 * Process and optimize merchant profile image
 */
export const processMerchantImage = async (
  inputBuffer: Buffer,
  outputPath: string
): Promise<ProcessedImageResult> => {
  try {
    const processed = await sharp(inputBuffer)
      .resize(
        IMAGE_CONFIG.MERCHANT_PROFILE.width,
        IMAGE_CONFIG.MERCHANT_PROFILE.height,
        {
          fit: "cover",
          position: "center",
        }
      )
      .jpeg({ quality: IMAGE_CONFIG.MERCHANT_PROFILE.quality })
      .toBuffer();

    await fs.writeFile(outputPath, processed);

    const metadata = await sharp(processed).metadata();

    return {
      success: true,
      outputPath,
      fileName: path.basename(outputPath),
      size: processed.length,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to process merchant image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Process and optimize menu item image
 */
export const processMenuImage = async (
  inputBuffer: Buffer,
  outputPath: string
): Promise<ProcessedImageResult> => {
  try {
    const processed = await sharp(inputBuffer)
      .resize(IMAGE_CONFIG.MENU_ITEM.width, IMAGE_CONFIG.MENU_ITEM.height, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: IMAGE_CONFIG.MENU_ITEM.quality })
      .toBuffer();

    await fs.writeFile(outputPath, processed);

    const metadata = await sharp(processed).metadata();

    return {
      success: true,
      outputPath,
      fileName: path.basename(outputPath),
      size: processed.length,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to process menu image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Generate thumbnail for any image
 */
export const generateThumbnail = async (
  inputBuffer: Buffer,
  outputPath: string
): Promise<ProcessedImageResult> => {
  try {
    const processed = await sharp(inputBuffer)
      .resize(IMAGE_CONFIG.THUMBNAIL.width, IMAGE_CONFIG.THUMBNAIL.height, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: IMAGE_CONFIG.THUMBNAIL.quality })
      .toBuffer();

    await fs.writeFile(outputPath, processed);

    const metadata = await sharp(processed).metadata();

    return {
      success: true,
      outputPath,
      fileName: path.basename(outputPath),
      size: processed.length,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate thumbnail: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Process image with custom options
 */
export const processImageWithOptions = async (
  inputBuffer: Buffer,
  outputPath: string,
  options: ImageProcessingOptions
): Promise<ProcessedImageResult> => {
  try {
    let pipeline = sharp(inputBuffer);

    // Apply resize if dimensions are specified
    if (options.width || options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: options.fit || "cover",
        position: "center",
      });
    }

    // Apply format and quality
    switch (options.format || "jpeg") {
      case "jpeg":
        pipeline = pipeline.jpeg({ quality: options.quality || 85 });
        break;
      case "png":
        pipeline = pipeline.png({ quality: options.quality || 85 });
        break;
      case "webp":
        pipeline = pipeline.webp({ quality: options.quality || 85 });
        break;
    }

    const processed = await pipeline.toBuffer();
    await fs.writeFile(outputPath, processed);

    const metadata = await sharp(processed).metadata();

    return {
      success: true,
      outputPath,
      fileName: path.basename(outputPath),
      size: processed.length,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to process image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Get image metadata without processing
 */
export const getImageMetadata = async (
  inputBuffer: Buffer
): Promise<{
  width?: number;
  height?: number;
  format?: string;
  size: number;
}> => {
  try {
    const metadata = await sharp(inputBuffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: inputBuffer.length,
    };
  } catch (error) {
    throw new Error(
      `Failed to get image metadata: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Validate image dimensions and format
 */
export const validateImage = async (
  inputBuffer: Buffer
): Promise<{
  valid: boolean;
  error?: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    size: number;
  };
}> => {
  try {
    const metadata = await getImageMetadata(inputBuffer);

    // Check if it's a supported format
    const supportedFormats = ["jpeg", "jpg", "png", "webp"];
    if (
      metadata.format &&
      !supportedFormats.includes(metadata.format.toLowerCase())
    ) {
      return {
        valid: false,
        error: `Unsupported image format: ${
          metadata.format
        }. Supported formats: ${supportedFormats.join(", ")}`,
      };
    }

    // Check minimum dimensions
    const minWidth = 100;
    const minHeight = 100;
    if (metadata.width && metadata.width < minWidth) {
      return {
        valid: false,
        error: `Image width too small. Minimum width: ${minWidth}px`,
      };
    }
    if (metadata.height && metadata.height < minHeight) {
      return {
        valid: false,
        error: `Image height too small. Minimum height: ${minHeight}px`,
      };
    }

    return {
      valid: true,
      metadata,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid image file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Convert image to WebP format for better compression
 */
export const convertToWebP = async (
  inputBuffer: Buffer,
  outputPath: string,
  quality: number = 85
): Promise<ProcessedImageResult> => {
  try {
    const processed = await sharp(inputBuffer).webp({ quality }).toBuffer();

    await fs.writeFile(outputPath, processed);

    const metadata = await sharp(processed).metadata();

    return {
      success: true,
      outputPath,
      fileName: path.basename(outputPath),
      size: processed.length,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to convert to WebP: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};
