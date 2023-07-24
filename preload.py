def preload(parser):
    parser.add_argument(
        "--user-data-dir", type=str, 
        help="Path to directory with localFiles.", 
        default=None
    )