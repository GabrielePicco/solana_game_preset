import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lumberjack } from "../target/types/lumberjack";

describe("lumberjack", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Lumberjack as Program<Lumberjack>;

  it("Init player and chop tree!", async () => {

    const localKeypair = anchor.web3.Keypair.generate();

    const res = await anchor.getProvider().connection.requestAirdrop(localKeypair.publicKey, 1e9);
    await anchor.getProvider().connection.confirmTransaction(res, "confirmed");

    const [playerPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("player"),
        localKeypair.publicKey.toBuffer(),        
      ],
      program.programId
    );

    const [gameDataPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("gameData")       
      ],
      program.programId
    );

    let tx = await program.methods.initPlayer()
    .accounts(
      {
        player: playerPDA,
        gameData: gameDataPDA,
        signer: localKeypair.publicKey,        
        systemProgram: anchor.web3.SystemProgram.programId,
      }    
    )
    .signers([localKeypair])
    .rpc({skipPreflight: true});
    console.log("Init transaction", tx);
    
    await anchor.getProvider().connection.confirmTransaction(tx, "confirmed");

    console.log("Confirmed", tx);

    for (let i = 0; i < 11; i++) {
      console.log(`Chop instruction ${i}`);

      tx = await program.methods
      .chopTree("gameData", 0)
      .accounts(
        {
          sessionToken: null,
          player: playerPDA,
          gameData: gameDataPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
          signer: localKeypair.publicKey
        }    
      )
      .signers([localKeypair])
      .rpc({skipPreflight: true});
      console.log("Chop instruction", tx);
      await anchor.getProvider().connection.confirmTransaction(tx, "confirmed");
    }

    const accountInfo = await anchor.getProvider().connection.getAccountInfo(
      playerPDA, "confirmed"
    );
    const decoded = program.coder.accounts.decode("PlayerData", accountInfo.data);
    console.log("Player account info", JSON.stringify(decoded));
  });
});
