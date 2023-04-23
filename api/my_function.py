# api/my_function.py

from flask import Flask, request

app = Flask(__name__)

@app.route('/api/my_function', methods=['GET'])
def my_function():
    name = request.args.get('name', 'World')
    message = f'Hello, {name}!'
    return message, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000)
