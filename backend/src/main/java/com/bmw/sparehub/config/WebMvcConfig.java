package com.bmw.sparehub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * Resolve the upload directory in priority order:
     *  1. UPLOAD_DIR environment variable (set in docker-compose / prod)
     *  2. /app/uploads  (default Docker WORKDIR layout)
     *  3. ./uploads     (local dev fallback)
     */
    public static Path resolveUploadDir() {
        String envDir = System.getenv("UPLOAD_DIR");
        if (envDir != null && !envDir.isBlank()) {
            return Paths.get(envDir);
        }
        Path dockerDefault = Paths.get("/app/uploads");
        if (Files.exists(dockerDefault) || dockerDefault.toFile().getParentFile().exists()) {
            return dockerDefault;
        }
        return Paths.get("uploads");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = resolveUploadDir();
        String uploadPath = uploadDir.toAbsolutePath().normalize().toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
