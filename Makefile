SVGS = $(wildcard res/*.svg)
PNGS = $(SVGS:res/%.svg=img/%.png)

img/%.png: res/%.svg
	convert -background None $< $@

.PHONY: all clean

all: $(PNGS)

clean:
	rm $(PNGS)
