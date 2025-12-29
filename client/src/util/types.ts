type Props = {
    game: any;
};

type GameBoardProps = {
    game: any;
    buildType: BuildType;
};

type BuildType = "settlement" | "road" | "city";

type DevCard = {
    id: string;
    key: string;
    label: string;
};

export type { Props, BuildType, GameBoardProps, DevCard };