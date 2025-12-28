type Props = {
    game: any;
};

type GameBoardProps = {
    game: any;
    buildType: BuildType;
};

type BuildType = "settlement" | "road" | "city";

export type { Props, BuildType, GameBoardProps };