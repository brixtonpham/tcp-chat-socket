CC = gcc
CFLAGS = -Wall -Wextra -g -I./include
LDFLAGS =

# Source files
SERVER_SRC = src/server/main.c src/server/server.c src/server/handlers.c \
             src/common/protocol.c src/common/user.c src/common/friend.c \
             src/common/group.c src/common/message.c src/common/logger.c

CLIENT_SRC = src/client/main.c src/client/client.c src/client/ui.c \
             src/common/protocol.c

# Targets
all: server client

server: $(SERVER_SRC)
	$(CC) $(CFLAGS) -o bin/server $^ $(LDFLAGS)

client: $(CLIENT_SRC)
	$(CC) $(CFLAGS) -o bin/client $^ $(LDFLAGS)

clean:
	rm -f bin/server bin/client data/*.dat

.PHONY: all clean
