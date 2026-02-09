#!/bin/bash

# Create a simple gradient icon with initials "ND"
# Using ImageMagick

# 512x512 icon
convert -size 512x512 \
  gradient:'#0099ff-#00aaff' \
  -gravity center \
  -font DejaVu-Sans-Bold \
  -pointsize 280 \
  -fill white \
  -annotate +0+0 'ND' \
  icon-512.png

# 192x192 icon
convert icon-512.png -resize 192x192 icon-192.png

# 180x180 Apple touch icon
convert icon-512.png -resize 180x180 apple-touch-icon.png

# Favicon (32x32)
convert icon-512.png -resize 32x32 favicon.ico

echo "Icons created successfully!"
