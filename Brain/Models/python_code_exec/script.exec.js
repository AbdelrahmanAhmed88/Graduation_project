const { exec } = require("child_process");

async function FaceCheck(callback) {
    exec("python ./python_code_exec/python/access_control/AccesControlv3.py", (error, stdout, stderr) => {
        // if (error) {
        //   console.error(`Error: ${error.message}`);
        //   return;
        // }
        // if (stderr) {
        //   console.error(`Stderr: ${stderr}`);
        //   return;
        // }
        const identity = stdout.trim();
        callback(identity);
      });
}
async function storeEncoding() {
    exec("python ./python_code_exec/python/access_control/storeEncodings.py", (error, stdout, stderr) => {
                if (error) {
          console.error(`Error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`);
          return;
        }
        console.log(stdout);
      });
}

module.exports = {
    FaceCheck,
    storeEncoding
};