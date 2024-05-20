import random
import string
from pathlib import Path
import argparse
from dataclasses import dataclass


@dataclass
class FileType:
    abbr: str
    fullname: str
    default: tuple[int] = (5, 10, 5, 10, 1, 5)
    FILE_TYPE: str = "file"
    DIR_TYPE: str = "dir"


fileTypes = [
    FileType("f", FileType.FILE_TYPE),
    FileType("d", FileType.DIR_TYPE, (5, 10, 5, 10, 0, 5)),
]
varnames = (
    "minNumFiles",
    "maxNumFiles",
    "minLen",
    "maxLen",
    "minLenExt",
    "maxLenExt",
)


parser = argparse.ArgumentParser(description="Create random files")
for filetype in fileTypes:
    parser.add_argument(
        f"-{filetype.abbr}",
        f"--{filetype.fullname}",
        help="""The arguments are as follows in order:
minimum number of files to generate,
maximum number of files to generate,
minimum length for the filename,
maximum length for the filename,
maximum length for the filename extension,
maximum length for the filename extension. 
Subsequent arguments are ignored.""",
        nargs="*",
        default=filetype.default,
        type=int,
    )
parser.add_argument(
    "-wd",
    "--working-dir",
    default=Path(__file__).parents[0] / "files",
)
args = parser.parse_args()

dirToCreate = args.working_dir
for filetype in fileTypes:
    argsList = getattr(args, filetype.fullname)
    minOfArgsListVarnames = min(len(argsList), len(varnames))

    argsListFinal = (
        tuple(argsList[:minOfArgsListVarnames])
        + filetype.default[minOfArgsListVarnames:]
    )

    (
        minNumFiles,
        maxNumFiles,
        minLen,
        maxLen,
        minLenExt,
        maxLenExt,
    ) = argsListFinal

    if not Path(dirToCreate).exists():
        Path(dirToCreate).mkdir()

    numFiles = random.randint(minNumFiles, maxNumFiles)
    for i in range(numFiles):
        fileLen = random.randint(minLen, maxLen)
        extLen = random.randint(minLenExt, maxLenExt)
        fileBaseName = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=fileLen)
        )
        fileExt = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=extLen)
        )
        fileName = fileBaseName if fileExt == "" else f"{fileBaseName}.{fileExt}"
        filePath = dirToCreate / fileName
        if filetype.fullname == FileType.FILE_TYPE:
            with open(filePath, "w") as f:
                pass
        elif filetype.fullname == FileType.DIR_TYPE:
            Path(filePath).mkdir()
        else:
            raise ValueError("Invalid file type")
