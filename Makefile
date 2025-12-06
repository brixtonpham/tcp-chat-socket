CC = gcc
CFLAGS = -Wall -Wextra -g -I./include
LDFLAGS =

# Directories required at runtime/build
DIRS = bin data logs

# Source files
SERVER_SRC = src/server/main.c src/server/server.c src/server/handlers.c \
             src/common/protocol.c src/common/user.c src/common/friend.c \
             src/common/group.c src/common/message.c src/common/logger.c

CLIENT_SRC = src/client/main.c src/client/client.c src/client/ui.c \
             src/common/protocol.c

# Targets
all: server client

server: $(SERVER_SRC) | dirs
	$(CC) $(CFLAGS) -o bin/server $^ $(LDFLAGS)

client: $(CLIENT_SRC) | dirs
	$(CC) $(CFLAGS) -o bin/client $^ $(LDFLAGS)


clean:
	rm -f bin/server bin/client data/*.dat logs/*.log

# Ensure the output directory exists. Order-only dependency prevents
# rebuilding when the directory's timestamp changes.

# Create required directories (order-only dependency)
dirs:
	@mkdir -p $(DIRS)

.PHONY: all clean dirs

.PHONY: all clean
