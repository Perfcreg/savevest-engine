# Savevest Engine Docker Deployment

This guide provides instructions for building and deploying the Savevest Engine using Docker.

## 🚀 Quick Start

### Prerequisites
- Docker installed and running
- Node.js 20+ (for local development)
- Yarn or npm package manager
- Network connectivity for downloading dependencies

### Build and Run

```bash
# 1. Build the Docker image
docker build -t savevest-engine .

# 2. Run the container
docker run -p 3333:3333 savevest-engine

# 3. Access the application
curl http://localhost:3333
```

## 📋 Available Scripts

### Test Scripts
- `./test-engine.sh` - Comprehensive application validation (no Docker required)
- `./docker-test.sh` - Full Docker build and test workflow

### Local Development
- `./test-local.sh` - Test local build process

## 🐳 Docker Files

### Main Dockerfile
- **`Dockerfile`** - Standard production build
- **`Dockerfile.optimized`** - Production-ready with security best practices
- **`Dockerfile.test`** - Uses pre-built application (for network issues)
- **`Dockerfile.minimal`** - Minimal test setup

### Recommended: Dockerfile.optimized
```bash
docker build -f Dockerfile.optimized -t savevest-engine .
```

Features:
- Multi-stage build process
- Non-root user for security
- Health checks
- Optimized layer caching
- Production dependencies only

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
```

### Custom Port
```bash
docker run -p 8080:3333 -e PORT=3333 savevest-engine
```

## 🏥 Health Checks

The optimized Dockerfile includes health checks:
```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' <container_id>
```

## 🛠 Troubleshooting

### Network Connectivity Issues
If you encounter network issues during Docker build:

1. **Use pre-built approach:**
   ```bash
   # Build locally first
   yarn install
   yarn build
   
   # Use test Dockerfile
   docker build -f Dockerfile.test -t savevest-engine .
   ```

2. **Check Docker network settings:**
   ```bash
   docker info
   ```

3. **Use different registry:**
   ```bash
   # In Dockerfile, change yarn registry
   RUN yarn config set registry https://registry.npmjs.org/
   ```

### Common Issues

#### Build Fails with Dependency Conflicts
```bash
# Use legacy peer deps
RUN npm install --legacy-peer-deps
```

#### Permission Denied
```bash
# Fix file permissions
RUN chmod +x start.sh
```

#### Container Exits Immediately
```bash
# Check logs
docker logs <container_name>

# Run interactively
docker run -it savevest-engine sh
```

## 📊 Testing Workflow

### 1. Local Validation
```bash
./test-engine.sh
```

### 2. Docker Build Test
```bash
./docker-test.sh
```

### 3. Manual Testing
```bash
# Build
docker build -t savevest-engine .

# Run detached
docker run -d --name savevest-test -p 3333:3333 savevest-engine

# Check logs
docker logs savevest-test

# Test endpoint
curl http://localhost:3333

# Cleanup
docker stop savevest-test && docker rm savevest-test
```

## 🚀 Production Deployment

### Docker Compose (Recommended)
```yaml
version: '3.8'
services:
  savevest-engine:
    build: .
    ports:
      - "3333:3333"
    environment:
      - NODE_ENV=production
      - PORT=3333
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: savevest-engine
spec:
  replicas: 3
  selector:
    matchLabels:
      app: savevest-engine
  template:
    metadata:
      labels:
        app: savevest-engine
    spec:
      containers:
      - name: savevest-engine
        image: savevest-engine:latest
        ports:
        - containerPort: 3333
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3333"
```

## 📈 Performance Optimization

### Multi-stage Build
The optimized Dockerfile uses multi-stage builds to reduce image size:
- Development dependencies are removed
- Only production files are included
- Image size is minimized

### Security Best Practices
- Non-root user execution
- Minimal base image (Alpine Linux)
- Health checks for monitoring
- Proper file permissions

## 🔍 Monitoring

### Container Stats
```bash
docker stats savevest-engine
```

### Logs
```bash
# Follow logs
docker logs -f savevest-engine

# Last 100 lines
docker logs --tail 100 savevest-engine
```

### Health Status
```bash
# Check health endpoint
curl http://localhost:3333/health

# Container health status
docker inspect savevest-engine | grep Health -A 10
```

## 📝 Notes

- The application is built using AdonisJS framework
- Default port is 3333
- Build process includes TypeScript compilation
- Production build excludes development dependencies
- Startup script handles environment setup

## 🆘 Support

If you encounter issues:
1. Run `./test-engine.sh` to validate the application
2. Check Docker logs: `docker logs <container_name>`
3. Verify network connectivity
4. Ensure all required files are present
5. Check environment variables

For network connectivity issues during build, use the pre-built approach with `Dockerfile.test`.