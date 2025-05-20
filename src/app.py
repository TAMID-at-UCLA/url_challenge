import os
from flask import Flask, render_template

# project root is one level up from this file
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

app = Flask(
    __name__,
    template_folder=os.path.join(project_root, 'templates'),
    static_folder=os.path.join(project_root, 'static')
)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)