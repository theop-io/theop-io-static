#!/usr/bin/env python3

lorem_ipsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce vehicula id arcu sit amet egestas. Morbi sagittis pretium magna non vestibulum. Ut rutrum nunc ac finibus maximus. Duis magna mauris, iaculis eu velit a, aliquet iaculis urna. Curabitur condimentum non diam at malesuada. Donec ullamcorper ullamcorper ipsum at bibendum. Fusce felis eros, mattis a rhoncus vel, interdum egestas lectus. Vestibulum nisl erat, bibendum sit amet lorem eget, viverra malesuada metus. Donec sit amet laoreet urna, quis tempus odio. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris sollicitudin eros a arcu tempus ultrices. Suspendisse aliquet erat."

for word_idx in range(100):
    term = f"Word {word_idx}"
    definition = lorem_ipsum

    print(f"""<button class="glossary_term">{term}</button><span class="glossary_definition">{definition}</span>""")
