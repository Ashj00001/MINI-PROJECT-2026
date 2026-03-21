with open('src/app/pages/CreateTraining.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\\n', '\n')

with open('src/app/pages/CreateTraining.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
