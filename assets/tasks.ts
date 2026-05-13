export type Task = {
    id: string;
    subject: "matematyka" | "informatyka";
    title: string;
    problem: string;
    solution: string;
    manimCodes: string[];
};

export const TASKS: Task[] = [
    {
        id: "matma-pochodna-x2",
        subject: "matematyka",
        title: "Matura podstawowa — pochodna funkcji kwadratowej",
        problem: `Oblicz pochodną funkcji $f(x) = x^2$ oraz podaj nachylenie stycznej do wykresu tej funkcji w punkcie $x_0 = 1$.`,
        solution: `
Pochodna funkcji $f(x) = x^2$ to $f'(x) = 2x$.

**Wyprowadzenie.** Korzystamy z reguły potęgowej: dla $f(x) = x^n$ pochodna to $f'(x) = n x^{n-1}$. Tutaj $n = 2$, więc $f'(x) = 2 \\cdot x^{2-1} = 2x$.

**Nachylenie stycznej w $x_0 = 1$.** Wartość pochodnej w danym punkcie to dokładnie nachylenie stycznej, czyli $f'(1) = 2 \\cdot 1 = 2$.

**Interpretacja geometryczna.** Animacja pokazuje parabolę $y = x^2$ wraz ze styczną $y = 2x - 1$ przechodzącą przez punkt $(1, 1)$ — widać że styczna „pasuje" do krzywej w tym punkcie.
`.trim(),
        manimCodes: [
            `from manim import *

class Pochodna(Scene):
    def construct(self):
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-1, 9, 2],
            x_length=7,
            y_length=4,
        ).to_edge(DOWN)

        graph = axes.plot(lambda x: x**2, color=BLUE, x_range=[-2.5, 2.5])
        graph_label = Text("y = x²", font_size=28, color=BLUE).next_to(graph, UR, buff=0.2)

        self.play(Create(axes))
        self.play(Create(graph), Write(graph_label))
        self.wait(0.5)

        dot = Dot(axes.c2p(1, 1), color=YELLOW, radius=0.08)
        dot_label = Text("(1, 1)", font_size=20).next_to(dot, UR, buff=0.1)
        self.play(FadeIn(dot), Write(dot_label))
        self.wait(0.5)

        tangent = axes.plot(lambda x: 2*x - 1, color=RED, x_range=[-0.5, 2.5])
        tangent_label = Text("y' = 2x   →   y'(1) = 2", font_size=28, color=RED).to_edge(UP)
        self.play(Create(tangent), Write(tangent_label))
        self.wait(2)
`,
        ],
    },
    {
        id: "matma-rownanie-kwadratowe",
        subject: "matematyka",
        title: "Matura podstawowa — równanie kwadratowe",
        problem: `Rozwiąż równanie $x^2 - 5x + 6 = 0$.`,
        solution: `
Równanie $x^2 - 5x + 6 = 0$ jest równaniem kwadratowym o współczynnikach $a = 1$, $b = -5$, $c = 6$.

**Krok 1: wyróżnik.** Obliczamy $\\Delta = b^2 - 4ac = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1$.

**Krok 2: pierwiastki.** Ponieważ $\\Delta > 0$, istnieją dwa pierwiastki rzeczywiste dane wzorem $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} = \\frac{5 \\pm 1}{2}$. Stąd $x_1 = 2$ oraz $x_2 = 3$.

**Sprawdzenie wzorami Viete'a.** $x_1 \\cdot x_2 = 6$ (zgadza się z $c/a = 6$) i $x_1 + x_2 = 5$ (zgadza się z $-b/a = 5$). Wynik poprawny.
`.trim(),
        manimCodes: [
            `from manim import *

class Kwadratowe(Scene):
    def construct(self):
        eq = Text("x² - 5x + 6 = 0", font_size=44).to_edge(UP)
        self.play(Write(eq))
        self.wait(0.5)

        coeffs = Text("a = 1     b = -5     c = 6", font_size=28).next_to(eq, DOWN, buff=0.6)
        self.play(Write(coeffs))
        self.wait(0.5)

        delta = Text("Δ = b² - 4ac = 25 - 24 = 1", font_size=28).next_to(coeffs, DOWN, buff=0.5)
        self.play(Write(delta))
        self.wait(1)

        x1 = Text("x₁ = (5 - 1) / 2 = 2", font_size=30, color=GREEN).next_to(delta, DOWN, buff=0.6)
        x2 = Text("x₂ = (5 + 1) / 2 = 3", font_size=30, color=GREEN).next_to(x1, DOWN, buff=0.3)
        self.play(Write(x1))
        self.play(Write(x2))
        self.wait(2)
`,
        ],
    },
    {
        id: "matma-pitagoras",
        subject: "matematyka",
        title: "Twierdzenie Pitagorasa — przeciwprostokątna",
        problem: `W trójkącie prostokątnym przyprostokątne mają długości $a = 4$ i $b = 3$. Oblicz długość przeciwprostokątnej $c$.`,
        solution: `
Korzystamy z twierdzenia Pitagorasa: w trójkącie prostokątnym kwadrat długości przeciwprostokątnej równa się sumie kwadratów długości przyprostokątnych, czyli $a^2 + b^2 = c^2$.

**Podstawiamy dane.** $c^2 = 4^2 + 3^2 = 16 + 9 = 25$.

**Wyciągamy pierwiastek.** $c = \\sqrt{25} = 5$ — bierzemy wartość dodatnią, bo długość boku nie może być ujemna.

Odpowiedź: $c = 5$.
`.trim(),
        manimCodes: [
            `from manim import *

class Pitagoras(Scene):
    def construct(self):
        # Trójkąt prostokątny 3-4-5: kąt prosty w lewym dolnym rogu
        triangle = Polygon(
            [-2, -1, 0],
            [2, -1, 0],
            [-2, 2, 0],
            color=WHITE,
            stroke_width=3,
        )
        right_angle = Square(side_length=0.3, color=WHITE, stroke_width=2)
        right_angle.move_to([-1.85, -0.85, 0])

        label_a = Text("a = 4", font_size=24).move_to([0, -1.5, 0])
        label_b = Text("b = 3", font_size=24).move_to([-2.6, 0.5, 0])
        label_c = Text("c = ?", font_size=24, color=YELLOW).move_to([0.5, 1, 0])

        self.play(Create(triangle), Create(right_angle))
        self.play(Write(label_a), Write(label_b), Write(label_c))
        self.wait(1)

        formula = Text("a² + b² = c²", font_size=32, color=BLUE).to_edge(UP)
        calc1 = Text("16 + 9 = 25", font_size=28).move_to([3.5, 0.7, 0])
        calc2 = Text("c = √25 = 5", font_size=32, color=GREEN).move_to([3.5, -0.4, 0])

        self.play(Write(formula))
        self.wait(0.3)
        self.play(Write(calc1))
        self.wait(0.3)
        self.play(Write(calc2))
        self.wait(0.5)

        new_label_c = Text("c = 5", font_size=24, color=GREEN).move_to(label_c.get_center())
        self.play(Transform(label_c, new_label_c))
        self.wait(2)
`,
        ],
    },
    {
        id: "matma-pole-kola",
        subject: "matematyka",
        title: "Pole koła",
        problem: `Oblicz pole koła o promieniu $r = 5$. Wynik podaj z dokładnością do dwóch miejsc po przecinku.`,
        solution: `
Pole koła dane jest wzorem $P = \\pi r^2$. Promień to odległość od środka do dowolnego punktu na okręgu, a $\\pi \\approx 3{,}14159$ to stała pojawiająca się w geometrii koła.

**Podstawiamy promień.** $P = \\pi \\cdot 5^2 = 25\\pi$.

**Obliczamy wartość liczbową.** $P = 25 \\cdot 3{,}14159... \\approx 78{,}54$.

Odpowiedź: $P \\approx 78{,}54$ (lub dokładnie $25\\pi$).
`.trim(),
        manimCodes: [
            `from manim import *

class PoleKola(Scene):
    def construct(self):
        # Koło po lewej
        circle = Circle(radius=1.5, color=BLUE, fill_opacity=0.3).shift(LEFT * 3)
        self.play(Create(circle))

        center = Dot(circle.get_center(), color=WHITE)
        radius_line = Line(circle.get_center(), circle.get_center() + RIGHT * 1.5, color=YELLOW)
        radius_label = Text("r = 5", font_size=24, color=YELLOW).next_to(radius_line, UP, buff=0.1)

        self.play(FadeIn(center), Create(radius_line))
        self.play(Write(radius_label))
        self.wait(1)

        # Wzór i obliczenia po prawej
        formula = Text("P = π · r²", font_size=36).move_to([2.5, 2.5, 0])
        calc1 = Text("P = π · 5²", font_size=30).move_to([2.5, 1.2, 0])
        calc2 = Text("P = 25 π", font_size=30).move_to([2.5, 0.2, 0])
        calc3 = Text("P ≈ 78,54", font_size=36, color=GREEN).move_to([2.5, -1, 0])

        self.play(Write(formula))
        self.wait(0.3)
        self.play(Write(calc1))
        self.wait(0.3)
        self.play(Write(calc2))
        self.wait(0.3)
        self.play(Write(calc3))
        self.wait(2)
`,
        ],
    },
    {
        id: "info-wyszukiwanie-binarne",
        subject: "informatyka",
        title: "Wyszukiwanie binarne",
        problem: `W posortowanej tablicy $[2, 5, 8, 12, 16, 23, 38, 56, 72, 91]$ znajdź indeks elementu o wartości $23$ używając algorytmu wyszukiwania binarnego. Podaj kolejne sprawdzane środki przedziału.`,
        solution: `
Wyszukiwanie binarne wykorzystuje fakt, że tablica jest posortowana — w każdym kroku patrzymy na element w środku przeszukiwanego przedziału i porównujemy go z szukaną wartością. To pozwala odrzucić połowę przedziału naraz, dlatego algorytm działa w czasie $O(\\log n)$ zamiast $O(n)$.

**Krok 1.** Przedział $[0, 9]$, środek $m = 4$. $arr[4] = 16 < 23$, więc szukana wartość leży po prawej. Nowy przedział: $[5, 9]$.

**Krok 2.** Środek $m = 7$. $arr[7] = 56 > 23$, więc szukana wartość leży po lewej. Nowy przedział: $[5, 6]$.

**Krok 3.** Środek $m = 5$. $arr[5] = 23$ — znalezione.

Odpowiedź: szukana wartość znajduje się na indeksie $5$. Algorytm wykonał $3$ porównania zamiast aż $6$ przy wyszukiwaniu liniowym, a dla tablicy o milionie elementów wystarczyłoby ok. $20$ kroków.
`.trim(),
        manimCodes: [
            `from manim import *

class BinarySearch(Scene):
    def construct(self):
        arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]

        title = Text("Szukamy wartości 23", font_size=30).to_edge(UP)
        self.play(Write(title))

        # Tablica
        boxes = []
        for i, val in enumerate(arr):
            box = Square(side_length=0.7, color=WHITE, stroke_width=2)
            box.shift(RIGHT * (i - 4.5) * 0.75)
            label = Text(str(val), font_size=20).move_to(box.get_center())
            idx_label = Text(str(i), font_size=14, color=GRAY).next_to(box, DOWN, buff=0.15)
            boxes.append(VGroup(box, label, idx_label))

        self.play(*[FadeIn(b) for b in boxes])
        self.wait(0.5)

        # Krok 1
        status = Text("środek=4, arr[4]=16 < 23  →  szukamy w prawo",
                     font_size=22, color=YELLOW).to_edge(DOWN, buff=0.5)
        self.play(Write(status), boxes[4].animate.set_color(YELLOW))
        self.wait(1.5)
        self.play(*[boxes[i].animate.set_opacity(0.25) for i in range(5)])

        # Krok 2
        new_status = Text("środek=7, arr[7]=56 > 23  →  szukamy w lewo",
                         font_size=22, color=YELLOW).to_edge(DOWN, buff=0.5)
        self.play(Transform(status, new_status),
                 boxes[7].animate.set_color(YELLOW))
        self.wait(1.5)
        self.play(*[boxes[i].animate.set_opacity(0.25) for i in [7, 8, 9]])

        # Krok 3 — znaleziono
        final_status = Text("środek=5, arr[5]=23  ✓  ZNALEZIONO!",
                           font_size=24, color=GREEN).to_edge(DOWN, buff=0.5)
        self.play(Transform(status, final_status),
                 boxes[5].animate.set_color(GREEN))
        self.wait(2)
`,
        ],
    },
    {
        id: "info-sortowanie-babelkowe",
        subject: "informatyka",
        title: "Sortowanie bąbelkowe",
        problem: `Posortuj rosnąco tablicę $[5, 2, 8, 1]$ używając algorytmu sortowania bąbelkowego. Wypisz stan tablicy po każdej zamianie.`,
        solution: `
Sortowanie bąbelkowe polega na wielokrotnym przechodzeniu przez tablicę i zamianie sąsiednich elementów, jeśli są w niewłaściwej kolejności. Po każdym pełnym przebiegu największy nieposortowany element ląduje na swoim miejscu — stąd nazwa „bąbelkowe", bo większe wartości stopniowo „wypływają" na koniec.

**Przebieg 1.** Start $[5, 2, 8, 1]$. Porównujemy $5$ i $2$ — większy z przodu, zamiana: $[2, 5, 8, 1]$. Porównujemy $5$ i $8$ — w porządku. Porównujemy $8$ i $1$ — zamiana: $[2, 5, 1, 8]$.

**Przebieg 2.** Porównujemy $2$ i $5$ — w porządku. Porównujemy $5$ i $1$ — zamiana: $[2, 1, 5, 8]$. Porównujemy $5$ i $8$ — w porządku.

**Przebieg 3.** Porównujemy $2$ i $1$ — zamiana: $[1, 2, 5, 8]$. Reszta bez zmian.

Odpowiedź: $[1, 2, 5, 8]$. Pesymistyczna złożoność czasowa to $O(n^2)$, więc dla małych tablic OK, ale dla większych zbiorów lepiej sięgnąć po quicksort albo mergesort, które działają w $O(n \\log n)$.
`.trim(),
        manimCodes: [
            `from manim import *

class Sortowanie(Scene):
    def construct(self):
        title = Text("Sortowanie bąbelkowe", font_size=30).to_edge(UP)
        self.play(Write(title))

        def make_row(values):
            row = VGroup()
            for i, val in enumerate(values):
                box = Square(side_length=1, color=WHITE, stroke_width=2)
                box.shift(RIGHT * (i - 1.5) * 1.2)
                label = Text(str(val), font_size=32).move_to(box.get_center())
                row.add(VGroup(box, label))
            return row

        stany = [
            [5, 2, 8, 1],
            [2, 5, 8, 1],
            [2, 5, 1, 8],
            [2, 1, 5, 8],
            [1, 2, 5, 8],
        ]
        opisy = [
            "Stan początkowy",
            "Zamieniamy 5 i 2",
            "Zamieniamy 8 i 1",
            "Zamieniamy 5 i 1",
            "Zamieniamy 2 i 1  →  POSORTOWANE!",
        ]

        row = make_row(stany[0])
        status = Text(opisy[0], font_size=24).to_edge(DOWN, buff=0.6)
        self.play(FadeIn(row), Write(status))
        self.wait(1)

        for i in range(1, len(stany)):
            new_row = make_row(stany[i])
            color = GREEN if i == len(stany) - 1 else WHITE
            new_status = Text(opisy[i], font_size=24, color=color).to_edge(DOWN, buff=0.6)
            self.play(Transform(row, new_row), Transform(status, new_status))
            self.wait(1.2)

        self.wait(2)
`,
        ],
    },
];

export function getTaskById(id: string): Task | undefined {
    return TASKS.find((t) => t.id === id);
}
