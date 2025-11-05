#!/bin/bash

echo "🐳 Docker Test for Savevest Engine"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="savevest-engine"
CONTAINER_NAME="savevest-engine-test"
PORT=3333

echo -e "${BLUE}Step 1: Building Docker image...${NC}"
if docker build -t $IMAGE_NAME .; then
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build Docker image${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Testing Docker image...${NC}"

# Check if container is already running
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    echo -e "${YELLOW}⚠️  Stopping existing container...${NC}"
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

echo -e "${BLUE}Starting container in detached mode...${NC}"
if docker run -d --name $CONTAINER_NAME -p $PORT:$PORT $IMAGE_NAME; then
    echo -e "${GREEN}✅ Container started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start container${NC}"
    exit 1
fi

# Wait for container to start
echo -e "${BLUE}Waiting for application to start...${NC}"
sleep 10

# Check if container is running
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    echo -e "${GREEN}✅ Container is running${NC}"
    
    # Show container logs
    echo ""
    echo -e "${BLUE}Container logs:${NC}"
    docker logs $CONTAINER_NAME
    
    # Test if port is accessible (basic connectivity test)
    echo ""
    echo -e "${BLUE}Testing connectivity...${NC}"
    if curl -f -s -o /dev/null http://localhost:$PORT/health 2>/dev/null; then
        echo -e "${GREEN}✅ Health check endpoint is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check endpoint not accessible (this might be expected if no health route is configured)${NC}"
    fi
    
    # Show container stats
    echo ""
    echo -e "${BLUE}Container stats:${NC}"
    docker stats $CONTAINER_NAME --no-stream
    
else
    echo -e "${RED}❌ Container is not running${NC}"
    echo "Container logs:"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Cleanup${NC}"
echo "Do you want to stop and remove the test container? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
    echo -e "${GREEN}✅ Test container cleaned up${NC}"
else
    echo -e "${YELLOW}⚠️  Container left running. Access it at: http://localhost:$PORT${NC}"
    echo "To stop later, run: docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
fi

echo ""
echo -e "${GREEN}🎉 Docker test completed!${NC}"
echo ""
echo "Available Docker commands:"
echo "- Build: docker build -t $IMAGE_NAME ."
echo "- Run: docker run -p $PORT:$PORT $IMAGE_NAME"
echo "- Run detached: docker run -d --name $CONTAINER_NAME -p $PORT:$PORT $IMAGE_NAME"
echo "- View logs: docker logs $CONTAINER_NAME"
echo "- Stop: docker stop $CONTAINER_NAME"