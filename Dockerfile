FROM node:24.14.0-alpine3.22

# Set working directory inside container
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
# This keeps image size minimal
RUN npm install --production && \
    npm cache clean --force

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to nodejs user (security best practice)
USER nodejs

# Expose port
EXPOSE 5000

# Health check - tells Docker how to verify container health
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "index.js"]
