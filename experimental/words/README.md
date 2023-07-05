Various approaches considered:

### Nested `div`

```
.showme {
  display: none;
}

.showhim:hover .showme {
  display: block;
}
<div class="showhim">HOVER ME
  <div class="showme">hai</div>
</div>
```

Works-ish but the layout gets weird with lots of elements.
Same with the other ideas on https://stackoverflow.com/questions/5210033/using-only-css-show-div-on-hover-over-another-element . 


### `details` / `summary`

```
    .glossary {
        display: inline;
    }

    details {
        display: inline;
    }

    summary {
        display: inline;
    }

    details[open] summary {
        font-weight: bold;
    }
```

and

```
<div class="glossary">
    <details>
        <summary>Click Here for more info</summary>
        Here is the extra info you were looking for.
    </details>
    <details>
        <summary>Click Here for more info</summary>
        Here is the extra info you were looking for.
    </details>
</div>
```

...can't readily figure out how to make the summary buttons flow on the same line, but works okay otherwise.

Also, making sure only one is open at a time requires a small amount of JS.