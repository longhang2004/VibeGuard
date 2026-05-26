#!/bin/bash

# ==============================================================================
# RTK-style Token Compressor Script
# Intercepts command output, filters noise, and compresses output for LLM context.
# Usage: ./scripts/rtk-compress.sh <command> [args...]
# ==============================================================================

if [ $# -eq 0 ]; then
  echo "Usage: $0 <command> [args...]"
  exit 1
fi

# Run the command and filter output:
# 1. tr -d '\r' to strip carriage returns (progress bars / loading spinners)
# 2. awk to drop duplicate blank lines, skip progress lines, and enforce maximum output limits
"$@" 2>&1 | tr -d '\r' | awk '
BEGIN {
  blank_count = 0;
  total_lines = 0;
  max_lines = 800; # Fit comfortably in agent view
}
{
  # Clean leading/trailing spaces
  clean_line = $0
  gsub(/^[ \t]+|[ \t]+$/, "", clean_line)

  # Check if line is empty or whitespace-only
  if (length(clean_line) == 0) {
    blank_count++;
    if (blank_count <= 1) {
      print "";
      total_lines++;
    }
  } else {
    blank_count = 0;
    
    # Filter common super-verbose boilerplate patterns:
    # - download progress lines (e.g. "120/450 KB", "10%")
    # - repetitive lockfile / fetch statuses
    if ($0 ~ /^[0-9]+%|[0-9]+\/[0-9]+\s*(KB|MB)|Download(ing)?\s*http/) {
       next;
    }
    
    # Print clean line
    print $0;
    total_lines++;
  }
  
  if (total_lines >= max_lines) {
    print "\n\033[1;31m[RTK Warning] Output exceeded " max_lines " lines. Truncating remaining output to save tokens.\033[0m";
    exit 0;
  }
}'
