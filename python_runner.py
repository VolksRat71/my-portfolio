from browser import window
import sys
from io import StringIO
import traceback

# Persistent namespace
_namespace = {}

def run_python_code(code):
    output = StringIO()
    sys.stdout = output
    sys.stderr = output

    try:
        # Try to evaluate as an expression first
        try:
            result = eval(code, _namespace)
            if result is not None:
                print(result)
        except SyntaxError:
            # If not an expression, execute as a statement
            exec(code, _namespace)

        return output.getvalue().strip()
    except Exception:
        return traceback.format_exc()
    finally:
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__

window.run_python_code = run_python_code
