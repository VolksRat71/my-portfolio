from browser import window
import sys
from io import StringIO
import traceback

# File handle class that works with VFS
class VFSFile:
    def __init__(self, path, mode='r'):
        self.path = path
        self.mode = mode
        self.content = None
        self.closed = False
        self.position = 0

        if 'r' in mode:
            # Read mode - load file synchronously
            try:
                # Note: VFS operations are async, but we can't await in Brython
                # We'll store a promise and handle it in read()
                self._load_content()
            except Exception as e:
                raise FileNotFoundError(f"[Errno 2] No such file or directory: '{path}'")
        elif 'w' in mode or 'a' in mode:
            if 'a' in mode:
                # Append mode - try to load existing content
                try:
                    self._load_content()
                except:
                    self.content = ''
            else:
                # Write mode - start with empty content
                self.content = ''

    def _load_content(self):
        # Synchronous read using JavaScript Promise (blocking)
        promise = window.vfs.readFile(self.path)
        # We need to handle this synchronously - for now, throw error
        # In a real implementation, we'd need async support
        raise NotImplementedError("Async file I/O not yet supported. Use read_file() and write_file() functions instead.")

    def read(self, size=-1):
        if self.closed:
            raise ValueError("I/O operation on closed file")
        if 'r' not in self.mode:
            raise IOError("File not open for reading")

        if size == -1:
            result = self.content[self.position:]
            self.position = len(self.content)
            return result
        else:
            result = self.content[self.position:self.position + size]
            self.position += len(result)
            return result

    def write(self, text):
        if self.closed:
            raise ValueError("I/O operation on closed file")
        if 'w' not in self.mode and 'a' not in self.mode:
            raise IOError("File not open for writing")

        if self.content is None:
            self.content = ''

        if 'a' in self.mode:
            self.content += text
        else:
            if self.position == 0:
                self.content = text
            else:
                self.content = self.content[:self.position] + text + self.content[self.position:]
            self.position += len(text)

        return len(text)

    def close(self):
        if not self.closed:
            if ('w' in self.mode or 'a' in self.mode) and self.content is not None:
                # Write content to VFS (async operation)
                window.vfs.writeFile(self.path, self.content)
            self.closed = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False

# Synchronous helper functions for VFS file operations
def read_file(path):
    """Synchronously read a file from VFS. Returns file contents as string."""
    # Create a container to store result
    result = {'value': None, 'error': None, 'done': False}

    def on_success(content):
        result['value'] = content
        result['done'] = True

    def on_error(error):
        result['error'] = str(error)
        result['done'] = True

    # Call VFS readFile (returns a Promise)
    promise = window.vfs.readFile(path)
    promise.then(on_success).catch(on_error)

    # Wait for promise to resolve (hacky busy-wait)
    timeout = 0
    while not result['done'] and timeout < 1000:
        timeout += 1

    if result['error']:
        raise FileNotFoundError(f"Error reading file: {result['error']}")
    if not result['done']:
        raise TimeoutError(f"Timeout reading file: {path}")

    return result['value']

def write_file(path, content):
    """Synchronously write content to a file in VFS."""
    result = {'done': False, 'error': None}

    def on_success(_):
        result['done'] = True

    def on_error(error):
        result['error'] = str(error)
        result['done'] = True

    promise = window.vfs.writeFile(path, content)
    promise.then(on_success).catch(on_error)

    timeout = 0
    while not result['done'] and timeout < 1000:
        timeout += 1

    if result['error']:
        raise IOError(f"Error writing file: {result['error']}")
    if not result['done']:
        raise TimeoutError(f"Timeout writing file: {path}")

    return True

def list_files():
    """List all files in the root directory."""
    result = {'value': None, 'error': None, 'done': False}

    def on_success(files):
        result['value'] = [f.path.split('/')[-1] for f in files]
        result['done'] = True

    def on_error(error):
        result['error'] = str(error)
        result['done'] = True

    promise = window.vfs.readdir('/')
    promise.then(on_success).catch(on_error)

    timeout = 0
    while not result['done'] and timeout < 1000:
        timeout += 1

    if result['error']:
        raise IOError(f"Error listing files: {result['error']}")
    if not result['done']:
        raise TimeoutError("Timeout listing files")

    return result['value']

# Persistent namespace with file I/O functions
_namespace = {
    'read_file': read_file,
    'write_file': write_file,
    'list_files': list_files,
}

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
