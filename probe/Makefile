CC      = gcc
CFLAGS  = -std=c11 -I include
LDFLAGS = -lcurl

SRC     = src/main.c src/config.c src/collector.c src/reporter.c
OBJ     = $(SRC:.c=.o)
BIN     = seaprobe

.PHONY: all clean

all: $(BIN)

$(BIN): $(SRC)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

clean:
	rm -f $(BIN) src/*.o
