# Image Optimization Guide

This guide provides best practices for image optimization in the ÅbenForms frontend application.

## Image Optimization Guidelines

### 1. Use Appropriate Image Formats

- **WebP**: Modern format with excellent compression. Use for photos and complex images.
- **SVG**: Vector format. Use for icons, logos, and simple graphics.
- **PNG**: Use for images requiring transparency.
- **JPEG**: Use for photos when WebP is not supported.

### 2. Responsive Images

Always provide multiple image sizes using the `srcset` attribute:

```html
<img
  src="/images/photo.jpg"
  srcset="
    /images/photo-320w.jpg 320w,
    /images/photo-640w.jpg 640w,
    /images/photo-1024w.jpg 1024w,
    /images/photo-1920w.jpg 1920w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Descriptive text"
  loading="lazy"
/>
```

### 3. Lazy Loading

Use the native `loading="lazy"` attribute for images below the fold:

```html
<img
  src="/images/below-fold.jpg"
  alt="Below fold image"
  loading="lazy"
/>
```

### 4. Image Size Recommendations

| Use Case | Max Width | Max Height | Quality | Format |
|----------|-----------|------------|---------|--------|
| Hero images | 1920px | 1080px | 80% | WebP/JPEG |
| Card thumbnails | 640px | 480px | 75% | WebP/JPEG |
| Icons | N/A | N/A | N/A | SVG |
| Avatars | 200px | 200px | 85% | WebP/PNG |
| Backgrounds | 1920px | 1080px | 70% | WebP/JPEG |

### 5. Optimization Tools

#### Using ImageOptim (macOS)
1. Download from https://imageoptim.com
2. Drag images to optimize
3. Save optimized versions to `/assets/images/`

#### Using Squoosh (Web)
1. Visit https://squoosh.app
2. Upload image
3. Choose WebP format
4. Adjust quality (75-85%)
5. Download optimized image

#### Using Sharp (Node.js)
```bash
npm install -g sharp-cli

# Convert to WebP
sharp input.jpg -o output.webp --webp-quality 80

# Resize and convert
sharp input.jpg -o output-640w.webp --resize 640 --webp-quality 80
```

### 6. Example: Optimized Image Component

Create a reusable component for optimized images:

```vue
<!-- components/OptimizedImage.vue -->
<template>
  <picture>
    <source
      v-if="webpSrc"
      :srcset="webpSrcset"
      type="image/webp"
    />
    <source
      :srcset="srcset"
      :type="`image/${format}`"
    />
    <img
      :src="src"
      :alt="alt"
      :loading="loading"
      :width="width"
      :height="height"
      :class="imgClass"
    />
  </picture>
</template>

<script setup lang="ts">
defineProps<{
  src: string
  webpSrc?: string
  srcset?: string
  webpSrcset?: string
  alt: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  format?: 'jpeg' | 'png' | 'webp'
  imgClass?: string
}>()
</script>
```

Usage:
```vue
<OptimizedImage
  src="/images/hero.jpg"
  webp-src="/images/hero.webp"
  srcset="/images/hero-640w.jpg 640w, /images/hero-1024w.jpg 1024w"
  webp-srcset="/images/hero-640w.webp 640w, /images/hero-1024w.webp 1024w"
  alt="Hero image"
  loading="lazy"
  format="jpeg"
/>
```

### 7. Background Images

Use CSS background images sparingly. When needed, provide WebP fallback:

```css
.hero-section {
  background-image: url('/images/hero.webp');
  background-size: cover;
  background-position: center;
}

/* Fallback for browsers without WebP support */
@supports not (background-image: url('image.webp')) {
  .hero-section {
    background-image: url('/images/hero.jpg');
  }
}
```

### 8. Performance Checklist

- [ ] All images are compressed
- [ ] Images below 100KB where possible
- [ ] WebP versions provided for photos
- [ ] SVG used for icons and logos
- [ ] Lazy loading enabled for below-fold images
- [ ] Responsive images with srcset
- [ ] Alt text provided for accessibility
- [ ] Width and height attributes set to prevent layout shift

### 9. Asset Organization

```
/assets/images/
├── icons/           # SVG icons
├── logos/           # Brand logos (SVG preferred)
├── photos/          # Optimized photos
│   ├── hero/        # Hero images
│   ├── thumbnails/  # Card thumbnails
│   └── backgrounds/ # Background images
└── avatars/         # User avatars
```

### 10. Automated Optimization

Consider adding a build step to automatically optimize images:

```json
{
  "scripts": {
    "optimize-images": "sharp-cli --input 'assets/images/**/*.{jpg,png}' --output 'public/images/' --format webp --quality 80"
  }
}
```

## Performance Impact

Proper image optimization can reduce page load times by:
- 40-60% reduction in image file sizes
- Faster Time to First Contentful Paint (FCP)
- Improved Largest Contentful Paint (LCP)
- Better mobile performance on slow connections

## Resources

- [WebP Documentation](https://developers.google.com/speed/webp)
- [Responsive Images Guide](https://web.dev/responsive-images/)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
- [ImageOptim](https://imageoptim.com)
- [Squoosh](https://squoosh.app)
