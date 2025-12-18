# Samsung ProtectMax Training Thumbnail

## Current Status
The training page is currently using an SVG placeholder thumbnail for all videos.

## To Add the Actual Image

1. **Save the provided image** from the conversation as `samsung-protectmax-thumbnail.jpg` in this directory (`public/images/training/`)

2. **Update the code** in `src/app/SEC/training/page.tsx`:
   - Replace the `SAMSUNG_PROTECTMAX_THUMBNAIL` constant value from the SVG data URL to:
   ```javascript
   const SAMSUNG_PROTECTMAX_THUMBNAIL = '/images/training/samsung-protectmax-thumbnail.jpg';
   ```

3. **Image Requirements:**
   - Format: JPEG
   - Aspect ratio: 16:9 (recommended: 1280x720 or 1920x1080)
   - Optimized for web (compressed but good quality)
   - Shows Samsung ProtectMax branding and presenter

## Current Implementation
All training videos use the same thumbnail for consistency, as specified in the requirements. The SVG placeholder shows "SAMSUNG PROTECTMAX Screen Protection Plan" with Zopper branding in a blue gradient background.