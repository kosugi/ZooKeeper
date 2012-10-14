# -*- coding: utf-8 -*-

from math import pi, sin, cos
from itertools import count

base_patterns = [
'''
.....
.....
.oo.o
.....
.....
''',
'''
.....
.o.o.
..o..
.....
.....
''',
'''
...o.
...o.
..o..
.....
.....
''',
'''
...o.
..o..
..o..
.....
.....
''']

r = range(-2, 3)
q = zip(count(), r)

def points(p):
    ys = set()
    for z in [1, -1]:
        for n in [0, 90, 180, 270]:
            vx = cos(n / 180.0 * pi)
            vy = sin(n / 180.0 * pi)
            xs = set()
            for (a, y) in q:
                for (b, x) in q:
                    if p[a][b] == 'o' and (0 <> x or 0 <> y):
                        s = int(round(z * x * vx - y * vy))
                        t = int(round(z * x * vy + y * vx))
                        xs.add((s, t))
            ys.add(tuple(xs))
    return ys

zs = []
for base_pattern in base_patterns:
    p = base_pattern.split()
    zs += points(p)

print repr(zs).replace('(', '[').replace(')', ']')
